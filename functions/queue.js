'use strict';

const queueCreatePost = require('./queues/createPost');
const queueRemovePost = require('./queues/removePost');

function addPost(evt) {
  return queueCreatePost.processNewPost(evt);
}

function removePost(evt) {
  return queueRemovePost.processRemovePost(evt);
}

module.exports = {
  addPost: addPost,
  removePost: removePost
};