'use strict';

function processRemovePost(evt) {
    console.log('Removing post | Starting');

    return new Promise((resolve, reject) => {
        const data = evt.data.val();

        // Check if removed
        if (!data) {
            return resolve('Removed from queue');
        }

        // Check on auth
        if (evt.auth.admin) {
            // Is admin
            return reject('Admin user');
        } else if (!evt.auth.variable) {
            // Un-auth user
            return reject('Non authorized user');
        }

        const userUid = evt.auth.variable.uid;

        if (data.post_uid && userUid) {
            return getPost(evt, data.post_uid).then((post) => {
                // Post exist
                return getUserPost(evt, data.post_uid, userUid).then((user_post) => {
                    // Post is from user
                    return removePost(evt, post).then((r) => {
                        return resolve(r);
                    }, (e) => {
                        return reject(e);
                    });
                }, (e) => {
                    return reject(e);
                });
            }, (e) => {
                return reject(e);
            });
        } else {
            return reject('Insufficient data');
        }
    }).then((r) => {
        console.log('Removing post | Finished: ' + r);
        return evt.data.ref.remove();
    }, (e) => {
        console.error(e);
        console.error('Removing post | Exited: ' + e);
        return evt.data.ref.remove();
    });
}

function getPost(evt, post_uid) {
    return new Promise((resolve, reject) => {
        evt.data.adminRef.root.child(`/posts/${post_uid}`).once('value', (post) => {
            if (post.val()) {
                return resolve(post);
            } else {
                return reject(`Post ${post_uid} not found...`);
            }
        });
    });
}

function getUserPost(evt, post_uid, user_uid) {
    return new Promise((resolve, reject) => {
        evt.data.adminRef.root.child(`/user_posts/${user_uid}/${post_uid}`).once('value', (user_post) => {
            if (user_post.val()) {
                return resolve(user_post);
            } else {
                return reject(`Post ${post_uid} not of user ${user_uid}`);
            }
        });
    });
}

function removePost(evt, post) {
    return new Promise((resolve, reject) => {
        const promises = [];
        const postData = post.val();

        const tags = postData.tags;
        if (tags) {
            for (let tag in tags) {
                tag = tags[tag].replace(/[&\/\\#,+()$@^~%.'";:*?!<>{}]/g, ''); //Remove special chars
                tag = tag.replace(/\s+/g, '').toLowerCase(); // Remove spaces & to lower case

                promises.push(evt.data.adminRef.root.child(`/tags/${tag}/posts/${post.key}`).remove());
                promises.push(evt.data.adminRef.root.child(`/tags_count/${tag}`).transaction((count) => {
                    if (count !== null && !isNaN(count) && count > 1) {
                        count--;
                    } else {
                        count = null;
                    }
                    return count;
                }));
            }
        }

        const location = postData.location.address_components;
        for (const type in location) {
            promises.push(evt.data.adminRef.root.child(`/location/${type}/${location[type].long_name}/posts/${post.key}`).remove());
            promises.push(evt.data.adminRef.root.child(`/location_count/${type}/${location[type].long_name}`).transaction((count) => {
                if (count !== null && !isNaN(count) && count > 1) {
                    count--;
                } else {
                    count = null;
                }
                return count;
            }));
        }

        promises.push(post.ref.remove());
        promises.push(evt.data.adminRef.root.child(`/user_posts/${postData.user_uid}/${post.key}`).remove());
        promises.push(evt.data.adminRef.root.child(`/votes/posts/${post.key}`).remove());
        promises.push(evt.data.adminRef.root.child(`/overview/${post.key}`).remove());
        promises.push(evt.data.adminRef.root.child(`/posts_ids/${post.key}`).remove());

        return Promise.all(promises).then((r) => {
            return resolve(`Post ${post.key} removed!`);
        }, (e) => {
            return reject(e);
        });
    });
}

module.exports = {
    processRemovePost: processRemovePost
};