import { Message } from '../../api/messages';
import { format } from 'date-fns';

interface MessageItemProps {
  message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
  return (
    <div className="flex gap-4 hover:bg-discord-gray/30 p-2 rounded group">
      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
        {message.avatar ? (
          <img src={message.avatar} alt={message.username} className="w-full h-full rounded-full" />
        ) : (
          <span className="text-white font-semibold">
            {message.username.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-semibold text-white">{message.username}</span>
          <span className="text-xs text-discord-text-muted">
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
        </div>
        <div className="text-discord-text break-words">{message.content}</div>
        {message.attachment && (
          <div className="mt-2">
            <img
              src={message.attachment}
              alt="Вложение"
              className="max-w-md rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

