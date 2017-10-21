module.exports = class RemoveComment {
    constructor(config) {
        if (!config.pathComments) {
            throw 'config.pathComments string missing. Looks like "/comments"';
        }
        if (!config.pathPosts) {
            throw 'config.pathPosts string missing. Looks like "/posts"';
        }
        if (!config.pathPostComments) {
            throw 'config.pathPostComments string missing. Looks like "/posts/comments"';
        }
        if (!config.pathUserData) {
            throw 'config.pathUserData string missing. Looks like "/user_data"';
        }
        if (!config.pathCommentVotes) {
            throw 'config.pathCommentVotes string missing. Looks like "/comments/votes"';
        }
        if (!config.pathCommentFavorites) {
            throw 'config.pathCommentFavorites string missing. Looks like "/comments/favorites"';
        }
        if (!config.pathCommentComments) {
            throw 'config.pathCommentComments string missing. Looks like "/comments/comments"';
        }
        this.pathComments = config.pathComments;
        this.pathPosts = config.pathPosts;
        this.pathPostComments = config.pathPostComments;
        this.pathUserData = config.pathUserData;
        this.pathCommentVotes = config.pathCommentVotes;
        this.pathCommentFavorites = config.pathCommentFavorites;
        this.pathCommentComments = config.pathCommentComments;
    }

    onTrigger() {
        return event => startProcess(this, event)
            .then(result => {
                console.log('Finished! ' + result);
                return event.data.ref.remove();
            }, error => {
                console.log('Errored');
                console.log(error);
                return event.data.ref.remove();
            });
    }
};

// Start Process
function startProcess(obj, event) {
    console.log('Removing Comment | Starting...');
    return new Promise((resolve, reject) => {

        const payload = event.data.val();
        const user = event.auth;

        if (!payload) return resolve('Removed from queue');

        // Check on auth
        if (user.admin) {
            // Is admin
            return reject('Admin user');
        } else if (!user.variable) {
            // Un-auth user
            return reject('Non authorized user');
        }

        const userID = user.variable.uid;
        const commentID = payload.comment_uid;

        return existComment(obj, commentID, event).then(() => {
            return getComment(obj, commentID, event).then((c) => {
                const comment = c.val();
                const postID = comment.post_uid;
                if (comment.user_uid !== userID) return reject('Not same user!');
                return Promise.all([
                    removeComment(obj, commentID, event),
                    removeUserRef(obj, userID, commentID, postID, event),
                    removePostRef(obj, commentID, postID, event),
                    removeVotes(obj, commentID, event),
                    removeFavorites(obj, commentID, event),
                    removeComments(obj, commentID, event),
                ]).then((r) => {
                    return resolve('Comment removed!');
                });
            });
        }).catch((e) => {
            return reject(e);
        });
    });
}

// Does Comment Exist
function existComment(obj, commentID, event) {
    return new Promise((resolve, reject) => {
        event.data.adminRef.root.child(obj.pathComments).child('ids').child(commentID).once('value', (comment) => {
            if (comment.val()) {
                // Exist
                return resolve(comment);
            }
            return reject('Comment does not exist');
        });
    });
}

// Get Comment Data
function getComment(obj, commentID, event) {
    return new Promise((resolve, reject) => {
        event.data.adminRef.root.child(obj.pathComments).child('data').child(commentID).once('value', (comment) => {
            if (comment.val()) {
                return resolve(comment);
            }
            return reject('Post does not exist');
        });
    });
}

// Does Post Exist
function existPost(obj, postID, event) {
    return new Promise((resolve, reject) => {
        event.data.adminRef.root.child(obj.pathPosts).child('ids').child(postID).once('value', (post) => {
            if (post.val()) {
                // Exist
                return resolve(post);
            }
            return reject('Post does not exist');
        });
    });
}

// Get Post Data
function getPost(obj, postID, event) {
    return new Promise((resolve, reject) => {
        event.data.adminRef.root.child(obj.pathPosts).child('data').child(postID).once('value', (post) => {
            if (post.val()) {
                return resolve(post);
            }
            return reject('Post does not exist');
        });
    });
}

// Process Comment
function removeComment(obj, commentID, event) {
    const data = event.data.adminRef.root.child(obj.pathComments).child('data').child(commentID).remove();
    const id = event.data.adminRef.root.child(obj.pathComments).child('ids').child(commentID).remove();
    // const count = decrement(event.data.adminRef.root.child(obj.pathComments).child('count'), true);
    return Promise.all([data, id]);
}

// Process User-ref
function removeUserRef(obj, userID, commentID, postID, event) {
    const data = event.data.adminRef.root.child(obj.pathUserData).child(userID).child('comments').child('data').child('posts').child('data').child(postID).child('data').child(commentID).remove();
    // const count = decrement(event.data.adminRef.root.child(obj.pathUserData).child(userID).child('comments').child('data').child('posts').child('data').child(postID).child('count'), true);
    // const countPost = decrement(event.data.adminRef.root.child(obj.pathUserData).child(userID).child('comments').child('data').child('posts').child('count'), true);
    // const countAll = decrement(event.data.adminRef.root.child(obj.pathUserData).child(userID).child('comments').child('count'), true);
    return Promise.all([data]);
}

function removePostRef(obj, commentID, postID, event) {
    const data = event.data.adminRef.root.child(obj.pathPostComments).child(postID).child('data').child(commentID).remove();
    // const count = decrement(event.data.adminRef.root.child(obj.pathPostComments).child(postID).child('count'));
    return Promise.all([data]);
}

// Process Init Votes
function removeVotes(obj, commentID, event) {
    // return event.data.adminRef.root.child(obj.pathCommentVotes).child(commentID).child('count').remove();
}

// Process Init Favorites
function removeFavorites(obj, commentID, event) {
    // return event.data.adminRef.root.child(obj.pathCommentFavorites).child(commentID).child('count').remove();
}

// Process Init Comments
function removeComments(obj, commentID, event) {
    // return event.data.adminRef.root.child(obj.pathCommentComments).child(commentID).child('count').remove();
}

// Decrement counts
function decrement(ref, toNull = false) {
    return ref.transaction((count) => {
        if (count !== null && count > 1) {
            count--;
        } else {
            if (toNull) {
                count = null;
            } else {
                count = 0;
            }
        }
        return count;
    });
}