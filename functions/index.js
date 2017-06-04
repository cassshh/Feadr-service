'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const queue = require('./queue');
const auth = require('./auth');

const CreatePost = functions.database.ref('/queue/posts/create/{postUid}')
    .onWrite(queue.addPost);

const RemovePost = functions.database.ref('/queue/posts/remove/{postUid}')
    .onWrite(queue.removePost);

const CreateComment = functions.database.ref('/queue/comments/create/{postUid}/{commentUid}')
    .onWrite(queue.createComment);

const RemoveComment = functions.database.ref('/queue/comments/remove/{postUid}/{commentUid}')
    .onWrite(queue.removeComment);

const NewUser = functions.auth.user().onCreate(auth.processNewUser);

module.exports = {
    CreatePost: CreatePost,
    RemovePost: RemovePost,
    CreateComment: CreateComment,
    RemoveComment: RemoveComment,
    NewUser: NewUser
};