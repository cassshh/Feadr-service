module.exports = class RemovePost {
    constructor(config) {
        if (!config.pathPosts) {
            throw 'config.pathPosts string missing. Looks like "/posts"';
        }
        if (!config.pathOverview) {
            throw 'config.pathOverview string missing. Looks like "/overview"';
        }
        if (!config.pathLocation) {
            throw 'config.pathLocation string missing. Looks like "/location"';
        }
        if (!config.pathTags) {
            throw 'config.pathTags string missing. Looks like "/tags"';
        }
        if (!config.pathUserData) {
            throw 'config.pathUserData string missing. Looks like "/user_data"';
        }
        if (!config.pathPostVotes) {
            throw 'config.pathPostVotes string missing. Looks like "/posts/votes"';
        }
        if (!config.pathPostFavorites) {
            throw 'config.pathPostFavorites string missing. Looks like "/posts/favorites"';
        }
        if (!config.pathPostComments) {
            throw 'config.pathPostComments string missing. Looks like "/posts/comments"';
        }
        this.pathPosts = config.pathPosts;
        this.pathOverview = config.pathOverview;
        this.pathLocation = config.pathLocation;
        this.pathTags = config.pathTags;
        this.pathUserData = config.pathUserData;
        this.pathPostVotes = config.pathPostVotes;
        this.pathPostFavorites = config.pathPostFavorites;
        this.pathPostComments = config.pathPostComments;
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
    console.log('Removal Post | Starting...');
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
        const postID = payload.post_uid;

        return existPost(obj, postID, event).then(() => {
            return getPost(obj, postID, event).then((p) => {
                const post = p.val();
                if (post.user_uid !== userID) return reject('Not same user!');
                return Promise.all([
                    removePost(obj, postID, event),
                    removeOverview(obj, postID, event),
                    removeLocation(obj, post, postID, event),
                    removeTags(obj, post, postID, event),
                    removeUserRef(obj, post, postID, event),
                    removeVotes(obj, postID, event),
                    removeFavorites(obj, postID, event),
                    removeComments(obj, postID, event)
                ]).then((r) => {
                    return resolve('Post removed!');
                });
            });
        }).catch((e) => {
            return reject(e);
        });
    });
}

// Does post exist
function existPost(obj, postID, event) {
    return new Promise((resolve, reject) => {
        event.data.adminRef.root.child(obj.pathPosts).child('ids').child(postID).once('value', (post) => {
            if (post.val()) {
                // Exist, directly remove id
                return resolve(post.ref.remove());
            }
            return reject('Post does not exist');
        });
    });
}

// Get post data
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

// Process Post
function removePost(obj, postID, event) {
    const data = event.data.adminRef.root.child(obj.pathPosts).child('data').child(postID).remove();
    //const count = decrement(event.data.adminRef.root.child(obj.pathPosts).child('count'));
    return Promise.all([data]);
}

// Process Overview
function removeOverview(obj, postID, event) {
    return event.data.adminRef.root.child(obj.pathOverview).child(postID).remove();
}

// Process Location
function removeLocation(obj, post, postID, event) {
    // Process locations
    const promises = [];
    const location = post.location.address_components;
    for (const type in location) {
        promises.push(event.data.adminRef.root.child(obj.pathLocation).child('data').child(type).child(location[type].long_name).child('posts').child(postID).remove());
        //promises.push(decrement(event.data.adminRef.root.child(obj.pathLocation).child('count').child(type).child(location[type].long_name)));
    }
    return Promise.all(promises);
}

// Process Tags
function removeTags(obj, post, postID, event) {
    // Process tags

    if (!post.tags) return resolve();
    const promises = [];
    const tags = post.tags;
    for (let tag in tags) {
        // Strip tags so more tags fall under one node
        tag = tags[tag].replace(/[&\/\\#,+()$@^~%.'";:*?!<>{}]/g, ''); //Remove special chars
        tag = tag.replace(/\s+/g, '').toLowerCase(); // Remove spaces & to lower case

        promises.push(event.data.adminRef.root.child(obj.pathTags).child('data').child(tag).child('posts').child(postID).remove());
        //promises.push(decrement(event.data.adminRef.root.child(obj.pathTags).child('count').child(tag)));
    }
    return Promise.all(promises);
}

// Process User-ref
function removeUserRef(obj, post, postID, event) {
    const data = event.data.adminRef.root.child(obj.pathUserData).child(post.user_uid).child('posts').child('data').child(postID).remove();
    //const count = decrement(event.data.adminRef.root.child(obj.pathUserData).child(post.user_uid).child('posts').child('count'));
    return Promise.all([data]);
}

// Process Init Votes
function removeVotes(obj, postID, event) {
    // TODO remove data
    return event.data.adminRef.root.child(obj.pathPostVotes).child(postID).child('count').remove();
}

// Process Init Favorites
function removeFavorites(obj, postID, event) {
    return event.data.adminRef.root.child(obj.pathPostFavorites).child(postID).child('count').remove();
}

// Process Init Comments
function removeComments(obj, postID, event) {
    return event.data.adminRef.root.child(obj.pathPostComments).child(postID).child('count').remove();
}

// Increment counts
function decrement(ref) {
    return ref.transaction((count) => {
        if (count !== null && count > 1) {
            count--;
        } else {
            count = null;
        }
        return count;
    });
}