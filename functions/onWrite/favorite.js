module.exports = class Favorite {
    constructor(config) {
        if (!config.pathPosts) {
            throw 'config.pathPosts string missing. Looks like "/posts"';
        }
        if (!config.pathComments) {
            throw 'config.pathComments string missing. Looks like "/comments"';
        }
        if (!config.pathPostFavorites) {
            throw 'config.pathFavorites string missing. Looks like "/posts/favorites"';
        }
        if (!config.pathCommentFavorites) {
            throw 'config.pathCommentFavorites string missing. Looks like "/comments/favorites"';
        }
        if (!config.pathUserData) {
            throw 'config.pathUserData string missing. Looks like "/user_data"';
        }
        this.pathPosts = config.pathPosts;
        this.pathComments = config.pathComments;
        this.pathPostFavorites = config.pathPostFavorites;
        this.pathCommentFavorites = config.pathCommentFavorites;
        this.pathUserData = config.pathUserData;

        // Path set in process
        this.pathType;
        this.pathTypeFavorites;
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
    console.log('Favoriting | Starting...');
    return new Promise((resolve, reject) => {

        const payload = event.data.val();
        const type = event.params.type;
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

        if(type !== 'posts' && type !== 'comments') {
            return reject ('Invalid type: ' + type);
        }

        if(type === 'posts') {
            obj.pathType = obj.pathPosts;
            obj.pathTypeFavorites = obj.pathPostFavorites;
        }
        if (type === 'comments') {
            obj.pathType = obj.pathComments;
            obj.pathTypeFavorites = obj.pathCommentFavorites;
        }

        const userID = user.variable.uid;
        const typeID = payload.type_uid;

        return existType(obj, typeID, event).then(() => {
            return getType(obj, typeID, event).then((t) => {
                const typeVal = t.val();
                return hasFavorite(obj, userID, type, typeID, event).then((bool) => {
                    if (bool) {
                        // Unfavorite
                        return unfavorite(obj, userID, type, typeID, event).then((r) => {
                            console.log('Send notification?');
                            return resolve('Unfavorited!');
                        });
                    }
                    // Favorite
                    return favorite(obj, userID, type, typeID, event).then((r) => {
                        console.log('Send notification?');
                        return resolve('Favorited!');
                    });
                });
            });
        }).catch((e) => {
            return reject(e);
        });
    });
}

// Does Type Exist
function existType(obj, typeID, event) {
    return new Promise((resolve, reject) => {
        event.data.adminRef.root.child(obj.pathType).child('ids').child(typeID).once('value', (type) => {
            if (type.val()) {
                // Exist
                return resolve(type);
            }
            return reject('Type does not exist');
        });
    });
}

// Get Type Data
function getType(obj, typeID, event) {
    return new Promise((resolve, reject) => {
        event.data.adminRef.root.child(obj.pathType).child('data').child(typeID).once('value', (type) => {
            if (type.val()) {
                return resolve(type);
            }
            return reject('Type does not exist');
        });
    });
}

// Has Favorite
function hasFavorite(obj, userID, type, typeID, event) {
    return new Promise((resolve, reject) => {
        event.data.adminRef.root.child(obj.pathUserData).child(userID).child('favorites').child(type).child('data').child(typeID).once('value', (favorite) => {
            if (favorite.val()) {
                return resolve(true);
            }
            return resolve(false);
        });
    });
}

// Favorite
function favorite(obj, userID, type, typeID, event) {
    const userData = event.data.adminRef.root.child(obj.pathUserData).child(userID).child('favorites').child(type).child('data').child(typeID).set(true);
    //const userCount = increment(event.data.adminRef.root.child(obj.pathUserData).child(userID).child('favorites').child(type).child('count'));
    const typeData = event.data.adminRef.root.child(obj.pathTypeFavorites).child(typeID).child('data').child(userID).set(true);
    //const typeCount = increment(event.data.adminRef.root.child(obj.pathTypeFavorites).child(typeID).child('count'));
    return Promise.all([userData, typeData]);
}

// Unfavorite
function unfavorite(obj, userID, type, typeID, event) {
    const userData = event.data.adminRef.root.child(obj.pathUserData).child(userID).child('favorites').child(type).child('data').child(typeID).remove();
    //const userCount = decrement(event.data.adminRef.root.child(obj.pathUserData).child(userID).child('favorites').child(type).child('count'), true);
    const typeData = event.data.adminRef.root.child(obj.pathTypeFavorites).child(typeID).child('data').child(userID).remove();
    //const typeCount = decrement(event.data.adminRef.root.child(obj.pathTypeFavorites).child(typeID).child('count'));
    return Promise.all([userData, typeData]);
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