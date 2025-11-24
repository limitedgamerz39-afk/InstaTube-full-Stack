// Initialize MongoDB database and user for InstaTube
print('Starting MongoDB initialization...');

// Switch to the instatube database
db = db.getSiblingDB('instatube');

// Create a user for the instatube database
db.createUser({
  user: 'instatube_user',
  pwd: 'instatube_password',
  roles: [
    {
      role: 'readWrite',
      db: 'instatube'
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