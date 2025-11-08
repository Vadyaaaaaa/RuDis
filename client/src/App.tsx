import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { useSocketStore } from './store/socketStore';
import ServerList from './components/ServerList/ServerList';
import ChannelList from './components/ChannelList/ChannelList';
import ChatArea from './components/Chat/ChatArea';
import VoiceCall from './components/VoiceCall/VoiceCall';
import CreateServerModal from './components/Modals/CreateServerModal';

function App() {
  const { user, token, setAuth } = useAuthStore();
  const { socket, connect } = useSocketStore();
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [activeVoiceChannel, setActiveVoiceChannel] = useState<{ id: string; name: string } | null>(null);
  const [isCreateServerModalOpen, setIsCreateServerModalOpen] = useState(false);
  const [serverListRefresh, setServerListRefresh] = useState(0);

  // Автоматический вход как гость
  useEffect(() => {
    if (!user || !token) {
      const guestUser = {
        id: 'guest-' + Date.now(),
        username: 'Гость',
        email: 'guest@ruscord.com',
      };
      const guestToken = 'guest-token-' + Date.now();
      setAuth(guestUser, guestToken);
    }
  }, [user, token, setAuth]);

  useEffect(() => {
    if (token && !socket) {
      connect();
    }
  }, [token, socket, connect]);

  return (
    <div className="flex h-screen">
      <ServerList
        selectedServerId={selectedServerId}
        onSelectServer={(serverId) => {
          setSelectedServerId(serverId);
          setSelectedChannelId(null);
        }}
        onCreateServer={() => setIsCreateServerModalOpen(true)}
        refreshTrigger={serverListRefresh}
      />
      <ChannelList
        serverId={selectedServerId}
        selectedChannelId={selectedChannelId}
        onSelectChannel={(channelId) => {
          setSelectedChannelId(channelId);
          setActiveVoiceChannel(null);
        }}
        onSelectVoiceChannel={(channelId, channelName) => {
          setActiveVoiceChannel({ id: channelId, name: channelName });
          setSelectedChannelId(null);
        }}
      />
      <div className="flex-1 flex flex-col">
        <div className="h-12 bg-discord-gray border-b border-discord-dark flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Hash className="text-discord-text-muted" size={20} />
            <span className="text-white font-semibold">
              {activeVoiceChannel
                ? activeVoiceChannel.name
                : selectedChannelId
                ? 'Канал'
                : 'Ruscord'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-discord-text-muted">{user?.username || 'Гость'}</span>
          </div>
        </div>
        {activeVoiceChannel ? (
          <VoiceCall
            channelId={activeVoiceChannel.id}
            channelName={activeVoiceChannel.name}
            onEndCall={() => setActiveVoiceChannel(null)}
          />
        ) : (
          <ChatArea channelId={selectedChannelId} />
        )}
      </div>
      <CreateServerModal
        isOpen={isCreateServerModalOpen}
        onClose={() => setIsCreateServerModalOpen(false)}
        onServerCreated={() => {
          setServerListRefresh((prev) => prev + 1);
        }}
      />
    </div>
  );
}

function Hash({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="4" y1="9" x2="20" y2="9"></line>
      <line x1="4" y1="15" x2="20" y2="15"></line>
      <line x1="10" y1="3" x2="8" y2="21"></line>
      <line x1="16" y1="3" x2="14" y2="21"></line>
    </svg>
  );
}

export default App;

