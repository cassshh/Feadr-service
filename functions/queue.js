'use strict';

const queueCreatePost = require('./queues/createPost');
const queueRemovePost = require('./queues/removePost');
const queueCreateComment = require('./queues/createComment');
const queueRemoveComment = require('./queues/removeComment');

function addPost(evt) {
  return queueCreatePost.processNewPost(evt);
}

function removePost(evt) {
  return queueRemovePost.processRemovePost(evt);
}

function createComment(evt) {
  return queueCreateComment.processNewComment(evt);
}

function removeComment(evt) {
  return queueRemoveComment.processRemoveComment(evt);
}

module.exports = {
  addPost: addPost,
  removePost: removePost,
  createComment: createComment,
  removeComment: removeComment
};