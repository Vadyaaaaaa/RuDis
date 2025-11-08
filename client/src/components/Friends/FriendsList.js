import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Friends.css';

function FriendsList() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'add'

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await axios.get('/api/friends');
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await axios.get('/api/friends/requests');
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/friends/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (username) => {
    try {
      await axios.post('/api/friends/request', { username });
      alert('Запрос в друзья отправлен');
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка отправки запроса');
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await axios.post(`/api/friends/accept/${requestId}`);
      fetchFriends();
      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка принятия запроса');
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      await axios.post(`/api/friends/reject/${requestId}`);
      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка отклонения запроса');
    }
  };

  const removeFriend = async (friendId) => {
    if (!window.confirm('Удалить из друзей?')) return;

    try {
      await axios.delete(`/api/friends/${friendId}`);
      fetchFriends();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка удаления из друзей');
    }
  };

  return (
    <div className="friends-container">
      <div className="friends-header">
        <h2>Друзья</h2>
        <div className="friends-tabs">
          <button
            className={activeTab === 'friends' ? 'active' : ''}
            onClick={() => setActiveTab('friends')}
          >
            Друзья ({friends.length})
          </button>
          <button
            className={activeTab === 'requests' ? 'active' : ''}
            onClick={() => setActiveTab('requests')}
          >
            Запросы {requests.length > 0 && `(${requests.length})`}
          </button>
          <button
            className={activeTab === 'add' ? 'active' : ''}
            onClick={() => setActiveTab('add')}
          >
            Добавить
          </button>
        </div>
      </div>

      <div className="friends-content">
        {activeTab === 'friends' && (
          <div className="friends-list">
            {friends.length === 0 ? (
              <div className="empty-state">У вас пока нет друзей</div>
            ) : (
              friends.map(friend => (
                <div key={friend.id} className="friend-item">
                  <div className="friend-avatar">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt={friend.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="friend-info">
                    <div className="friend-username">{friend.username}</div>
                  </div>
                  <button
                    className="remove-friend-btn"
                    onClick={() => removeFriend(friend.id)}
                    title="Удалить из друзей"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="requests-list">
            {requests.length === 0 ? (
              <div className="empty-state">Нет входящих запросов</div>
            ) : (
              requests.map(request => (
                <div key={request.id} className="request-item">
                  <div className="friend-avatar">
                    {request.avatar ? (
                      <img src={request.avatar} alt={request.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {request.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="friend-info">
                    <div className="friend-username">{request.username}</div>
                    <div className="request-text">хочет добавить вас в друзья</div>
                  </div>
                  <div className="request-actions">
                    <button
                      className="accept-btn"
                      onClick={() => acceptRequest(request.id)}
                    >
                      Принять
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => rejectRequest(request.id)}
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="add-friend">
            <div className="search-box">
              <input
                type="text"
                placeholder="Поиск по имени пользователя..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="search-input"
              />
            </div>

            {loading && <div className="loading">Поиск...</div>}

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(user => (
                  <div key={user.id} className="search-result-item">
                    <div className="friend-avatar">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} />
                      ) : (
                        <div className="avatar-placeholder">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="friend-info">
                      <div className="friend-username">{user.username}</div>
                    </div>
                    <button
                      className="add-friend-btn"
                      onClick={() => sendFriendRequest(user.username)}
                    >
                      Добавить
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && !loading && searchResults.length === 0 && (
              <div className="empty-state">Пользователи не найдены</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendsList;

