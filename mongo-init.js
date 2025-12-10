// Initialize MongoDB database and user for D4D HUB
print('Starting MongoDB initialization...');

// Switch to the d4dhub database
db = db.getSiblingDB('d4dhub');

// Create a user for the d4dhub database
db.createUser({
  user: 'd4dhub_user',
  pwd: 'd4dhub_password',
  roles: [
    {
      role: 'readWrite',
      db: 'd4dhub'
    }
  ]
});

// Create collections
db.createCollection('users');
db.createCollection('posts');
db.createCollection('achievements');
db.createCollection('notifications');
db.createCollection('messages');
db.createCollection('stories');
db.createCollection('groups');
db.createCollection('playlists');
db.createCollection('subscriptions');
db.createCollection('creators');
db.createCollection('superchats');
db.createCollection('communities');
db.createCollection('notes');
db.createCollection('highlights');
db.createCollection('businesses');
db.createCollection('audio');
db.createCollection('livestreams');
db.createCollection('videocalls');
db.createCollection('audiocalls');
db.createCollection('monetizations');

print('MongoDB initialization completed.');