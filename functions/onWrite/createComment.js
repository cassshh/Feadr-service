module.exports = class CreateComment {
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
    console.log('Creating Comment | Starting...');
    return new Promise((resolve, reject) => {

        const payload = event.data.val();
        const uid = event.params.uid;
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
        const postID = payload.post_uid;

        return existPost(obj, postID, event).then(() => {
            return getPost(obj, postID, event).then((p) => {
                const post = p.val(); // Access to OP, send notification?
                return createCommentObject(payload, userID).then(comment => {
                    return Promise.all([
                        createComment(obj, comment, uid, event),
                        createUserRef(obj, userID, uid, postID, event),
                        createPostRef(obj, uid, postID, event),
                        createVotes(obj, uid, event),
                        createFavorites(obj, uid, event),
                        createComments(obj, uid, event)
                    ]).then((r) => {
                        return resolve('Comment created!');
                    });
                });
            });
        }).catch((e) => {
            return reject(e);
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

// Sanitize Comment Object
function createCommentObject(payload, userID) {
    return new Promise((resolve, reject) => {

        // Set new values
        payload.user_uid = userID;
        payload.time = new Date().toISOString();

        return resolve(payload);
    });
}

// Process Comment
function createComment(obj, comment, commentID, event) {
    const data = event.data.adminRef.root.child(obj.pathComments).child('data').child(commentID).set(comment);
    const id = event.data.adminRef.root.child(obj.pathComments).child('ids').child(commentID).set(true);
    // const count = increment(event.data.adminRef.root.child(obj.pathComments).child('count'));
    return Promise.all([data, id]);
}

// Process User-ref
function createUserRef(obj, userID, commentID, postID, event) {
    const data = event.data.adminRef.root.child(obj.pathUserData).child(userID).child('comments').child('data').child('posts').child('data').child(postID).child('data').child(commentID).set(true);
    // const count = increment(event.data.adminRef.root.child(obj.pathUserData).child(userID).child('comments').child('data').child('posts').child('data').child(postID).child('count'));
    // const countPost = increment(event.data.adminRef.root.child(obj.pathUserData).child(userID).child('comments').child('data').child('posts').child('count'));
    // const countAll = increment(event.data.adminRef.root.child(obj.pathUserData).child(userID).child('comments').child('count'));
    return Promise.all([data]);
}

function createPostRef(obj, commentID, postID, event) {
    const data = event.data.adminRef.root.child(obj.pathPostComments).child(postID).child('data').child(commentID).set(true);
    // const count = increment(event.data.adminRef.root.child(obj.pathPostComments).child(postID).child('count'));
    return Promise.all([data]);
}

// Process Init Votes
function createVotes(obj, commentID, event) {
    // return event.data.adminRef.root.child(obj.pathCommentVotes).child(commentID).child('count').set({
    //     upvotes: 0,
    //     downvotes: 0
    // });
}

// Process Init Favorites
function createFavorites(obj, commentID, event) {
    // return event.data.adminRef.root.child(obj.pathCommentFavorites).child(commentID).child('count').set(0);
}

// Process Init Comments
function createComments(obj, commentID, event) {
    // return event.data.adminRef.root.child(obj.pathCommentComments).child(commentID).child('count').set(0);
}

// Increment counts
function increment(ref) {
    return ref.transaction((count) => {
        if (count !== null) {
            count++;
        } else {
            count = 1;
        }
        return count;
    });
}