const functions = require('firebase-functions');
const admin = require('firebase-admin');
const config = functions.config();
admin.initializeApp(config.firebase);

// Paths
const pathPosts = 'test/posts';
const pathOverview = 'test/overview';
const pathLocation = 'test/location';
const pathTags = 'test/tags';

const pathComments = 'test/comments';

const pathUsers = 'test/users';
const pathUserData = 'test/user_data';

const pathPostVotes = pathPosts + '/votes';
const pathPostFavorites = pathPosts + '/favorites';
const pathPostComments = pathPosts + '/comments';

const pathCommentVotes = pathComments + '/votes';
const pathCommentFavorites = pathComments + '/favorites';
const pathCommentComments = pathComments + '/comments';

// First auth of user
const CreateUser = require('./onCreate/createUser');
const createUser = new CreateUser({
    pathUsers: pathUsers,
    database: admin.database(),
});
exports.onCreateUser = functions.auth.user().onCreate(createUser.getFunction());

// POST
// Create post
const CreatePost = require('./onWrite/createPost');
const createPost = new CreatePost({
    pathPosts: pathPosts,
    pathOverview: pathOverview,
    pathLocation: pathLocation,
    pathTags: pathTags,
    pathUserData: pathUserData,
    pathPostVotes: pathPostVotes,
    pathPostFavorites: pathPostFavorites,
    pathPostComments: pathPostComments,
});
exports.onCreatePost = functions.database.ref('/test/queue/posts/create/{uid}').onWrite(createPost.onTrigger());

// Remove post
const RemovePost = require('./onWrite/removePost');
const removePost = new RemovePost({
    pathPosts: pathPosts,
    pathOverview: pathOverview,
    pathLocation: pathLocation,
    pathTags: pathTags,
    pathUserData: pathUserData,
    pathPostVotes: pathPostVotes,
    pathPostFavorites: pathPostFavorites,
    pathPostComments: pathPostComments,
});
exports.onRemovePost = functions.database.ref('/test/queue/posts/remove/{uid}').onWrite(removePost.onTrigger());

// Post type
const CountTypes = require('./onWrite/countTypes');
const countTypes = new CountTypes({
});
exports.countTypes = functions.database.ref('/test/{type}/ids/{uid}').onWrite(countTypes.onTrigger());

// User Posts count
const CountUserPosts = require('./onWrite/countUserPosts');
const countUserPosts = new CountUserPosts({
});
exports.countUserPosts = functions.database.ref('/test/user_data/{user}/posts/data/{uid}').onWrite(countUserPosts.onTrigger());

// Location Posts count
const CountLocationPosts = require('./onWrite/countLocationPosts');
const countLocationPosts = new CountLocationPosts({
});
exports.countLocationPosts = functions.database.ref('/test/location/data/{type}/{area}/posts/{uid}').onWrite(countLocationPosts.onTrigger());

// Tags Posts count
const CountTagsPosts = require('./onWrite/countTagsPosts');
const countTagsPosts = new CountTagsPosts({
});
exports.countTagsPosts = functions.database.ref('/test/tags/data/{tag}/posts/{uid}').onWrite(countTagsPosts.onTrigger());

// Favorite post
const Favorite = require('./onWrite/favorite');
const favorite = new Favorite({
    pathPosts: pathPosts,
    pathComments: pathComments,
    pathPostFavorites: pathPostFavorites,
    pathCommentFavorites: pathCommentFavorites,
    pathUserData: pathUserData,
});
exports.onFavoritePost = functions.database.ref('/test/queue/{type}/favorite/{uid}').onWrite(favorite.onTrigger());

// Favorites count
const CountFavorites = require('./onWrite/countFavorites');
const countFavorites = new CountFavorites({
});
exports.countFavorites = functions.database.ref('/test/{type}/favorites/{type_uid}/data/{uid}').onWrite(countFavorites.onTrigger());

// User Favorites count
const CountUserFavorites = require('./onWrite/countUserFavorites');
const countUserFavorites = new CountUserFavorites({
});
exports.countUserFavorites = functions.database.ref('/test/user_data/{user}/favorites/{type}/data/{uid}').onWrite(countUserFavorites.onTrigger());

// Vote
const Vote = require('./onWrite/vote');
const vote = new Vote({
    pathPosts: pathPosts,
    pathComments: pathComments,
    pathPostVotes: pathPostVotes,
    pathCommentVotes: pathCommentVotes,
    pathUserData: pathUserData,
});
exports.onVote = functions.database.ref('/test/queue/{type}/vote/{action}/{uid}').onWrite(vote.onTrigger());

// Count votes
const CountVotes = require('./onWrite/countVotes');
const countVotes = new CountVotes();
exports.countVotes = functions.database.ref('/test/{type}/votes/{type_uid}/data/{action}/{uid}').onWrite(countVotes.onTrigger());

// Count user votes
const CountUserVotes = require('./onWrite/countUserVotes');
const countUserVotes = new CountUserVotes();
exports.countUserVotes = functions.database.ref('/test/user_data/{user}/votes/{type}/data/{action}/{uid}').onWrite(countUserVotes.onTrigger());


// Create Comment
const CreateComment = require('./onWrite/createComment');
const createComment = new CreateComment({
    pathComments: pathComments,
    pathPosts: pathPosts,
    pathPostComments: pathPostComments,
    pathUserData: pathUserData,
    pathCommentVotes: pathCommentVotes,
    pathCommentFavorites: pathCommentFavorites,
    pathCommentComments: pathCommentComments,
});
exports.onCreateComment = functions.database.ref('/test/queue/comments/create/{uid}').onWrite(createComment.onTrigger());

// Create comment
const RemoveComment = require('./onWrite/removeComment');
const removeComment = new RemoveComment({
    pathComments: pathComments,
    pathPosts: pathPosts,
    pathPostComments: pathPostComments,
    pathUserData: pathUserData,
    pathCommentVotes: pathCommentVotes,
    pathCommentFavorites: pathCommentFavorites,
    pathCommentComments: pathCommentComments,
});
exports.onRemoveComment = functions.database.ref('/test/queue/comments/remove/{uid}').onWrite(removeComment.onTrigger());