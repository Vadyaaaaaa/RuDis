import React from 'react';
import './ServerList.css';

function ServerList({ servers, selectedServer, setSelectedServer, onCreateServer }) {
  return (
    <div className="server-list">
      {servers.map(server => (
        <button
          key={server.id}
          className={`server-icon ${selectedServer?.id === server.id ? 'active' : ''}`}
          onClick={() => setSelectedServer(server)}
          title={server.name}
        >
          {server.name.charAt(0).toUpperCase()}
        </button>
      ))}
      <button
        className="server-icon add-server"
        onClick={onCreateServer}
        title="Создать сервер"
      >
        +
      </button>
    </div>
  );
}

export default ServerList;

