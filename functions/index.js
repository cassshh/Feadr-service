'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const queue = require('./queue');
const auth = require('./auth');

const ProcessPost = functions.database.ref('/queue/posts/{action}/{push}')
    .onWrite(queue.processPost);

const ProcessComment = functions.database.ref('/queue/comments/{action}/{push}')
    .onWrite(queue.processComment);

const ProcessVote = functions.database.ref('/queue/votes/{type}/{action}/{push}')
    .onWrite(queue.processVote);

const NewUser = functions.auth.user().onCreate(auth.processNewUser);

module.exports = {
    ProcessPost: ProcessPost,
    ProcessComment: ProcessComment,
    ProcessVote: ProcessVote,
    NewUser: NewUser
};