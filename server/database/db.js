const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data.json');

let database = {
  users: [],
  servers: [],
  channels: [],
  messages: [],
  verificationCodes: [],
  friendships: [] // { id, userId, friendId, status: 'pending'|'accepted'|'blocked', createdAt }
};

// Initialize database file
function initializeDatabase() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
  } else {
    try {
      const data = fs.readFileSync(dbPath, 'utf8');
      database = JSON.parse(data);
      // Убеждаемся, что verificationCodes существует
      if (!database.verificationCodes) {
        database.verificationCodes = [];
      }
      // Убеждаемся, что friendships существует
      if (!database.friendships) {
        database.friendships = [];
        saveDatabase();
      }
    } catch (error) {
      console.error('Error reading database:', error);
      database = {
        users: [],
        servers: [],
        channels: [],
        messages: [],
        verificationCodes: [],
        friendships: []
      };
      saveDatabase();
    }
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

function getUsers() {
  return database.users;
}

function getUserById(id) {
  return database.users.find(u => u.id === id);
}

function getUserByEmail(email) {
  return database.users.find(u => u.email === email);
}

function getUserByUsername(username) {
  return database.users.find(u => u.username === username);
}

function createUser(user) {
  database.users.push(user);
  saveDatabase();
  return user;
}

function getServers() {
  return database.servers;
}

function getServerById(id) {
  return database.servers.find(s => s.id === id);
}

function getUserServers(userId) {
  return database.servers.filter(s => 
    s.members.some(m => m.id === userId) || s.ownerId === userId
  );
}

function createServer(server) {
  database.servers.push(server);
  saveDatabase();
  return server;
}

function getChannelsByServer(serverId) {
  return database.channels.filter(c => c.serverId === serverId);
}

function getChannelById(id) {
  return database.channels.find(c => c.id === id);
}

function createChannel(channel) {
  database.channels.push(channel);
  saveDatabase();
  return channel;
}

function getMessagesByChannel(channelId) {
  return database.messages.filter(m => m.channelId === channelId);
}

function createMessage(message) {
  database.messages.push(message);
  saveDatabase();
  return message;
}

function createVerificationCode(codeData) {
  // Удаляем старые коды для этого email
  database.verificationCodes = database.verificationCodes.filter(
    c => c.email !== codeData.email
  );
  
  database.verificationCodes.push(codeData);
  saveDatabase();
  return codeData;
}

function getVerificationCode(email, code) {
  return database.verificationCodes.find(
    c => c.email === email && c.code === code && new Date(c.expiresAt) > new Date()
  );
}

function getVerificationCodeByEmail(email) {
  return database.verificationCodes.find(
    c => c.email === email && new Date(c.expiresAt) > new Date()
  );
}

function deleteVerificationCode(email) {
  database.verificationCodes = database.verificationCodes.filter(
    c => c.email !== email
  );
  saveDatabase();
}

function updateUserVerificationStatus(userId, verified) {
  const user = getUserById(userId);
  if (user) {
    user.verified = verified;
    saveDatabase();
    return user;
  }
  return null;
}

// Friendships functions
function createFriendship(friendship) {
  database.friendships.push(friendship);
  saveDatabase();
  return friendship;
}

function getFriendship(userId, friendId) {
  return database.friendships.find(
    f => (f.userId === userId && f.friendId === friendId) ||
         (f.userId === friendId && f.friendId === userId)
  );
}

function getFriendshipsByUser(userId, status = null) {
  let friendships = database.friendships.filter(
    f => f.userId === userId || f.friendId === userId
  );
  
  if (status) {
    friendships = friendships.filter(f => f.status === status);
  }
  
  return friendships;
}

function updateFriendshipStatus(userId, friendId, status) {
  const friendship = getFriendship(userId, friendId);
  if (friendship) {
    friendship.status = status;
    saveDatabase();
    return friendship;
  }
  return null;
}

function deleteFriendship(userId, friendId) {
  database.friendships = database.friendships.filter(
    f => !((f.userId === userId && f.friendId === friendId) ||
           (f.userId === friendId && f.friendId === userId))
  );
  saveDatabase();
}

function getFriendsList(userId) {
  const friendships = getFriendshipsByUser(userId, 'accepted');
  return friendships.map(f => {
    const friendId = f.userId === userId ? f.friendId : f.userId;
    const friend = getUserById(friendId);
    return friend ? {
      id: friend.id,
      username: friend.username,
      avatar: friend.avatar
    } : null;
  }).filter(f => f !== null);
}

function getPendingRequests(userId) {
  const friendships = getFriendshipsByUser(userId, 'pending');
  return friendships
    .filter(f => f.friendId === userId) // Только входящие запросы
    .map(f => {
      const requester = getUserById(f.userId);
      return requester ? {
        id: f.id,
        userId: f.userId,
        username: requester.username,
        avatar: requester.avatar,
        createdAt: f.createdAt
      } : null;
    })
    .filter(f => f !== null);
}

module.exports = {
  initializeDatabase,
  getUsers,
  getUserById,
  getUserByEmail,
  getUserByUsername,
  createUser,
  getServers,
  getServerById,
  getUserServers,
  createServer,
  getChannelsByServer,
  getChannelById,
  createChannel,
  getMessagesByChannel,
  createMessage,
  createVerificationCode,
  getVerificationCode,
  getVerificationCodeByEmail,
  deleteVerificationCode,
  updateUserVerificationStatus,
  createFriendship,
  getFriendship,
  getFriendshipsByUser,
  updateFriendshipStatus,
  deleteFriendship,
  getFriendsList,
  getPendingRequests
};

