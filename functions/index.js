'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const queue = require('./queue');

const PostCreated = functions.database.ref('/queue/posts/{postUid}')
    .onWrite(queue.processNewPost);

module.exports = {
    PostCreated: PostCreated
};