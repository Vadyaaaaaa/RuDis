import React from 'react';
import './ChannelList.css';

function ChannelList({ channels, selectedChannel, setSelectedChannel }) {
  return (
    <div className="channel-list">
      {channels.map(channel => (
        <button
          key={channel.id}
          className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''}`}
          onClick={() => setSelectedChannel(channel)}
        >
          <span className="channel-hash">#</span>
          <span className="channel-name">{channel.name}</span>
        </button>
      ))}
    </div>
  );
}

export default ChannelList;

