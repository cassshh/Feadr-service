'use strict';

const queueCreatePost = require('./queues/createPost');
const queueRemovePost = require('./queues/removePost');
const queueCreateComment = require('./queues/createComment');

function addPost(evt) {
  return queueCreatePost.processNewPost(evt);
}

function removePost(evt) {
  return queueRemovePost.processRemovePost(evt);
}

function createComment(evt) {
  return queueCreateComment.processNewComment(evt);
}

module.exports = {
  addPost: addPost,
  removePost: removePost,
  createComment: createComment
};