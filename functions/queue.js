'use strict';

const createPost = require('./queues/createPost');
const removePost = require('./queues/removePost');
const createComment = require('./queues/createComment');
const removeComment = require('./queues/removeComment');
const vote = require('./queues/votes');
const favorite = require('./queues/favorite');

function processPost(evt) {
  const action = evt.params.action;
  console.log('Processing post | ' + action);
  switch(action) {
    case 'create':
      return createPost.processNewPost(evt);
    case 'remove':
      return removePost.processRemovePost(evt);
    default:
      return console.log('Invalid action: ' + action);
  }  
}

function processComment(evt) {
  const action = evt.params.action;
  console.log('Processing comment | ' + action);
  switch (action) {
    case 'create':
      return createComment.processNewComment(evt);
    case 'remove':
      return removeComment.processRemoveComment(evt);
    default:
      return console.log('Invalid action: ' + action);
  }
}

function processVote(evt) {
  return vote.processVote(evt);
}

function processFavorite(evt) {
  return favorite.processFavorite(evt);
}

module.exports = {
  processPost: processPost,
  processComment: processComment,
  processVote: processVote,
  processFavorite: processFavorite
};