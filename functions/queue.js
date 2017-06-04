'use strict';

const queueCreatePost = require('./queues/createPost');

function addPost(evt) {
  return queueCreatePost.processNewPost(evt);
}

module.exports = {
  addPost: addPost
};