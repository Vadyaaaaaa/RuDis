import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChannelView from './ChannelView';
import FriendsList from '../Friends/FriendsList';
import './MainLayout.css';

function MainLayout() {
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showFriends, setShowFriends] = useState(false);

  return (
    <div className="main-layout">
      <Sidebar 
        selectedServer={selectedServer}
        setSelectedServer={setSelectedServer}
        selectedChannel={selectedChannel}
        setSelectedChannel={setSelectedChannel}
        showFriends={showFriends}
        setShowFriends={setShowFriends}
      />
      {showFriends ? (
        <FriendsList />
      ) : (
        <ChannelView 
          server={selectedServer}
          channel={selectedChannel}
        />
      )}
    </div>
  );
}

export default MainLayout;

