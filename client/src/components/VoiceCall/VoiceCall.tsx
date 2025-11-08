import { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Users } from 'lucide-react';
import { useSocketStore } from '../../store/socketStore';
import { WebRTCService } from '../../services/webrtc';

interface VoiceCallProps {
  channelId: string;
  channelName: string;
  onEndCall: () => void;
}

export default function VoiceCall({ channelId, channelName, onEndCall }: VoiceCallProps) {
  const socket = useSocketStore((state) => state.socket);
  const [webrtc, setWebrtc] = useState<WebRTCService | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    if (!socket) return;

    const service = new WebRTCService(socket);
    setWebrtc(service);

    // Присоединяемся к звонку
    service.joinCall(channelId).then(() => {
      setIsConnected(true);
    }).catch((error) => {
      console.error('Ошибка присоединения к звонку:', error);
    });

    // Слушаем события участников
    socket.on('user-joined-call', (data: { userId: string; username: string }) => {
      setParticipants((prev) => [...prev, data.userId]);
    });

    socket.on('user-left-call', (data: { userId: string }) => {
      setParticipants((prev) => prev.filter((id) => id !== data.userId));
    });

    return () => {
      service.endCall();
      socket.off('user-joined-call');
      socket.off('user-left-call');
    };
  }, [socket, channelId]);

  // Воспроизведение удаленных аудио потоков
  useEffect(() => {
    if (!webrtc) return;

    const remoteStreams = webrtc.getRemoteStreams();
    
    remoteStreams.forEach((stream, userId) => {
      let audioElement = audioRefs.current.get(userId);
      
      if (!audioElement) {
        audioElement = new Audio();
        audioElement.autoplay = true;
        audioRefs.current.set(userId, audioElement);
      }

      if (audioElement.srcObject !== stream) {
        audioElement.srcObject = stream;
      }
    });

    // Удаляем неиспользуемые аудио элементы
    audioRefs.current.forEach((audio, userId) => {
      if (!remoteStreams.has(userId)) {
        audio.pause();
        audio.srcObject = null;
        audioRefs.current.delete(userId);
      }
    });
  }, [webrtc, participants]);

  const handleToggleMute = () => {
    if (!webrtc) return;
    const newMutedState = !webrtc.toggleMute();
    setIsMuted(newMutedState);
  };

  const handleEndCall = async () => {
    if (webrtc) {
      await webrtc.endCall();
    }
    onEndCall();
  };

  if (!isConnected) {
    return (
      <div className="flex-1 bg-discord-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-discord-text-muted">Подключение к звонку...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-discord-dark flex flex-col items-center justify-center p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">{channelName}</h2>
        <p className="text-discord-text-muted">
          {participants.length + 1} {participants.length === 0 ? 'участник' : 'участников'}
        </p>
      </div>

      <div className="flex gap-4 mb-8">
        {participants.map((userId) => (
          <div
            key={userId}
            className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl"
          >
            {userId.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleToggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isMuted
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-discord-gray hover:bg-discord-lightgray'
          }`}
          title={isMuted ? 'Включить микрофон' : 'Выключить микрофон'}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button
          onClick={handleEndCall}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
          title="Завершить звонок"
        >
          <PhoneOff size={24} />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-discord-text-muted">
        <Users size={16} />
        <span>Участники: {participants.length + 1}</span>
      </div>
    </div>
  );
}

