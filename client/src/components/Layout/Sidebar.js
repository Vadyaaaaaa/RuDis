import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import ServerList from './ServerList';
import ChannelList from './ChannelList';
import './Sidebar.css';

function Sidebar({ selectedServer, setSelectedServer, selectedChannel, setSelectedChannel, showFriends, setShowFriends }) {
  const { user, logout } = useAuth();
  const [servers, setServers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (selectedServer) {
      fetchChannels(selectedServer.id);
    } else {
      setChannels([]);
    }
  }, [selectedServer]);

  const fetchServers = async () => {
    try {
      const response = await axios.get('/api/servers');
      setServers(response.data);
      if (response.data.length > 0 && !selectedServer) {
        setSelectedServer(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching servers:', error);
    }
  };

  const fetchChannels = async (serverId) => {
    try {
      const response = await axios.get(`/api/channels/server/${serverId}`);
      setChannels(response.data);
      if (response.data.length > 0 && !selectedChannel) {
        setSelectedChannel(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const handleCreateServer = async (e) => {
    e.preventDefault();
    if (!newServerName.trim()) return;

    try {
      const response = await axios.post('/api/servers', { name: newServerName });
      setServers([...servers, response.data]);
      setSelectedServer(response.data);
      setNewServerName('');
      setShowCreateServer(false);
    } catch (error) {
      console.error('Error creating server:', error);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim() || !selectedServer) return;

    try {
      const response = await axios.post('/api/channels', {
        name: newChannelName,
        serverId: selectedServer.id
      });
      setChannels([...channels, response.data]);
      setNewChannelName('');
      setShowCreateChannel(false);
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  };

  return (
    <div className="sidebar">
      <div className="servers-section">
        <ServerList
          servers={servers}
          selectedServer={selectedServer}
          setSelectedServer={setSelectedServer}
          onCreateServer={() => setShowCreateServer(true)}
        />
      </div>

      {selectedServer && (
        <div className="channels-section">
          <div className="channels-header">
            <h3>{selectedServer.name}</h3>
            <button 
              className="add-button"
              onClick={() => setShowCreateChannel(true)}
              title="Создать канал"
            >
              +
            </button>
          </div>
          <ChannelList
            channels={channels}
            selectedChannel={selectedChannel}
            setSelectedChannel={setSelectedChannel}
          />
        </div>
      )}

      <div className="user-section">
        <button 
          className={`friends-button ${showFriends ? 'active' : ''}`}
          onClick={() => setShowFriends(!showFriends)}
          title="Друзья"
        >
          👥
        </button>
        <div className="user-info">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <span className="username">{user?.username}</span>
        </div>
        <button className="logout-button" onClick={logout} title="Выйти">
          ⚙️
        </button>
      </div>

      {showCreateServer && (
        <div className="modal-overlay" onClick={() => setShowCreateServer(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Создать сервер</h3>
            <form onSubmit={handleCreateServer}>
              <input
                type="text"
                placeholder="Название сервера"
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                autoFocus
              />
              <div className="modal-buttons">
                <button type="button" onClick={() => setShowCreateServer(false)}>
                  Отмена
                </button>
                <button type="submit">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateChannel && (
        <div className="modal-overlay" onClick={() => setShowCreateChannel(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Создать канал</h3>
            <form onSubmit={handleCreateChannel}>
              <input
                type="text"
                placeholder="Название канала"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                autoFocus
              />
              <div className="modal-buttons">
                <button type="button" onClick={() => setShowCreateChannel(false)}>
                  Отмена
                </button>
                <button type="submit">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;

