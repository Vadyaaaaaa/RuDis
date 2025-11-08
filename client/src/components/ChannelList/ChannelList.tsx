import { useEffect, useState } from 'react';
import { Channel } from '../../api/servers';
import { serversApi } from '../../api/servers';
import { Hash, Volume2 } from 'lucide-react';

interface ChannelListProps {
  serverId: string | null;
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onSelectVoiceChannel?: (channelId: string, channelName: string) => void;
}

export default function ChannelList({
  serverId,
  selectedChannelId,
  onSelectChannel,
  onSelectVoiceChannel,
}: ChannelListProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (serverId) {
      loadChannels();
    } else {
      setChannels([]);
    }
  }, [serverId]);

  const loadChannels = async () => {
    if (!serverId) return;
    setLoading(true);
    try {
      const response = await serversApi.getById(serverId);
      setChannels(response.channels || []);
    } catch (error) {
      console.error('Ошибка загрузки каналов:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!serverId) {
    return (
      <div className="w-60 bg-discord-gray flex items-center justify-center">
        <p className="text-discord-text-muted">Выберите сервер</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-60 bg-discord-gray flex items-center justify-center">
        <div className="text-discord-text-muted">Загрузка...</div>
      </div>
    );
  }

  const textChannels = channels.filter((c) => c.type === 'text');
  const voiceChannels = channels.filter((c) => c.type === 'voice');

  return (
    <div className="w-60 bg-discord-gray flex flex-col h-full">
      <div className="p-4 border-b border-discord-dark">
        <h2 className="text-white font-semibold">Каналы</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {textChannels.length > 0 && (
          <div className="mb-4">
            <div className="px-2 py-1 text-xs font-semibold text-discord-text-muted uppercase">
              Текстовые каналы
            </div>
            {textChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onSelectChannel(channel.id)}
                className={`w-full px-2 py-1.5 rounded flex items-center gap-2 text-sm hover:bg-discord-lightgray ${
                  selectedChannelId === channel.id
                    ? 'bg-discord-lightgray text-white'
                    : 'text-discord-text-muted'
                }`}
              >
                <Hash size={16} />
                {channel.name}
              </button>
            ))}
          </div>
        )}
        {voiceChannels.length > 0 && (
          <div>
            <div className="px-2 py-1 text-xs font-semibold text-discord-text-muted uppercase">
              Голосовые каналы
            </div>
            {voiceChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onSelectVoiceChannel?.(channel.id, channel.name)}
                className="w-full px-2 py-1.5 rounded flex items-center gap-2 text-sm hover:bg-discord-lightgray text-discord-text-muted"
              >
                <Volume2 size={16} />
                {channel.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

