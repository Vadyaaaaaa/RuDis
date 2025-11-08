import { useEffect, useState } from 'react';
import { Server } from '../../api/servers';
import { serversApi } from '../../api/servers';
import { Plus } from 'lucide-react';

interface ServerListProps {
  selectedServerId: string | null;
  onSelectServer: (serverId: string) => void;
  onCreateServer: () => void;
  refreshTrigger?: number;
}

export default function ServerList({
  selectedServerId,
  onSelectServer,
  onCreateServer,
  refreshTrigger,
}: ServerListProps) {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServers();
  }, [refreshTrigger]);

  const loadServers = async () => {
    try {
      const response = await serversApi.getAll();
      setServers(response.servers);
    } catch (error) {
      console.error('Ошибка загрузки серверов:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-16 bg-discord-darkest flex flex-col items-center py-2">
        <div className="w-12 h-12 rounded-full bg-discord-gray animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="w-16 bg-discord-darkest flex flex-col items-center py-2 space-y-2">
      <button
        onClick={onCreateServer}
        className="w-12 h-12 rounded-full bg-discord-gray hover:bg-green-600 flex items-center justify-center transition-colors"
        title="Создать сервер"
      >
        <Plus size={24} />
      </button>
      <div className="w-8 h-0.5 bg-discord-gray"></div>
      {servers.map((server) => (
        <button
          key={server.id}
          onClick={() => onSelectServer(server.id)}
          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white transition-all ${
            selectedServerId === server.id
              ? 'bg-blue-600 rounded-2xl'
              : 'bg-discord-gray hover:bg-blue-600 hover:rounded-2xl'
          }`}
          title={server.name}
        >
          {server.icon || server.name.charAt(0).toUpperCase()}
        </button>
      ))}
    </div>
  );
}

