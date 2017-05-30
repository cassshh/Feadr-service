'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const queue = require('./queue');
const auth = require('./auth');

const PostCreated = functions.database.ref('/queue/posts/{postUid}')
    .onWrite(queue.processNewPost);

const NewUser = functions.auth.user().onCreate(auth.processNewUser);

module.exports = {
    PostCreated: PostCreated,
    NewUser: NewUser
};