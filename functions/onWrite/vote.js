module.exports = class Vote {
    constructor(config) {
        if (!config.pathPosts) {
            throw 'config.pathPosts string missing. Looks like "/posts"';
        }
        if (!config.pathComments) {
            throw 'config.pathComments string missing. Looks like "/comments"';
        }
        if (!config.pathPostVotes) {
            throw 'config.pathPostVotes string missing. Looks like "/posts/votes"';
        }
        if (!config.pathCommentVotes) {
            throw 'config.pathCommentVotes string missing. Looks like "/comments/votes"';
        }
        if (!config.pathUserData) {
            throw 'config.pathUserData string missing. Looks like "/user_data"';
        }
        this.pathPosts = config.pathPosts;
        this.pathComments = config.pathComments;
        this.pathPostVotes = config.pathPostVotes;
        this.pathCommentVotes = config.pathCommentVotes;
        this.pathUserData = config.pathUserData;

        // Path set in process
        this.pathType;
        this.pathTypeVotes;
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
    console.log('Voting | Starting...');
    return new Promise((resolve, reject) => {

        const payload = event.data.val();
        const type = event.params.type;
        const action = event.params.action;
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

        // Check actions
        if (action !== 'upvote' && action !== 'downvote') {
            // Not valid action
            return reject('Unvalid action: ' + action);
        }

        if (type !== 'posts' && type !== 'comments') {
            return reject('Invalid type: ' + type);
        }

        if (type === 'posts') {
            obj.pathType = obj.pathPosts;
            obj.pathTypeVotes = obj.pathPostVotes;
        }
        if (type === 'comments') {
            obj.pathType = obj.pathComments;
            obj.pathTypeVotes = obj.pathCommentVotes;
        }

        const actionRef = action + 's';
        const userID = user.variable.uid;
        const typeID = payload.type_uid;

        return existType(obj, typeID, event).then(() => {
            return getType(obj, typeID, event).then((t) => {
                const typeVal = t.val();
                return hasVote(obj, userID, type, typeID, actionRef, event).then((bool) => {
                    if (bool) {
                        // Unvote
                        return unvote(obj, userID, type, typeID, actionRef, event).then((r) => {
                            console.log('Send notification?');
                            return resolve('Unvoted: ' + action);
                        });
                    }
                    // Vote
                    return vote(obj, userID, type, typeID, actionRef, event).then((r) => {
                        console.log('Send notification?');
                        const counterAction = action === 'upvote' ? 'downvote' : 'upvote';
                        const counterActionRef = counterAction + 's';
                        return hasVote(obj, userID, type, typeID, counterActionRef, event).then((bool) => {
                            if (bool) {
                                // Counter Vote exist... Unvote it
                                return unvote(obj, userID, type, typeID, counterActionRef, event).then((r) => {
                                    console.log('Send notification?');
                                    return resolve('Voted: ' + action + ' || Unvoted: ' + counterAction);
                                });
                            }
                            return resolve('Voted: ' + action);
                        });
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

// Has Vote
function hasVote(obj, userID, type, typeID, action, event) {
    return new Promise((resolve, reject) => {
        event.data.adminRef.root.child(obj.pathUserData).child(userID).child('votes').child(type).child('data').child(action).child(typeID).once('value', (vote) => {
            if (vote.val()) {
                return resolve(true);
            }
            return resolve(false);
        });
    });
}

// Vote
function vote(obj, userID, type, typeID, action, event) {
    const userData = event.data.adminRef.root.child(obj.pathUserData).child(userID).child('votes').child(type).child('data').child(action).child(typeID).set(true);
    // const userCount = increment(event.data.adminRef.root.child(obj.pathUserData).child(userID).child('votes').child(type).child('count').child(action));
    const typeData = event.data.adminRef.root.child(obj.pathTypeVotes).child(typeID).child('data').child(action).child(userID).set(true);
    //const typeCount = increment(event.data.adminRef.root.child(obj.pathTypeVotes).child(typeID).child('count').child(action));
    return Promise.all([userData, typeData]);
}

// Unvote
function unvote(obj, userID, type, typeID, action, event) {
    const userData = event.data.adminRef.root.child(obj.pathUserData).child(userID).child('votes').child(type).child('data').child(action).child(typeID).remove();
    // const userCount = decrement(event.data.adminRef.root.child(obj.pathUserData).child(userID).child('votes').child(type).child('count').child(action), true);
    const typeData = event.data.adminRef.root.child(obj.pathTypeVotes).child(typeID).child('data').child(action).child(userID).remove();
    //const typeCount = decrement(event.data.adminRef.root.child(obj.pathTypeVotes).child(typeID).child('count').child(action));
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