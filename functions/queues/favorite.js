'use strict';

function processFavorite(evt) {
    console.log('Favorite | Starting');

    return new Promise((resolve, reject) => {
        const data = evt.data.val();

        // Check if removed
        if (!data) {
            reject('Removed from queue');
        }

        // Check on auth
        if (evt.auth.admin) {
            // Is admin
            reject('Admin user');
        } else if (!evt.auth.variable) {
            // Un-auth user
            reject('Non authorized user');
        }
        
        const postUid = data.post_uid;
        const userUid = evt.auth.variable.uid;

        if(userUid && postUid) {
            console.log('Retrieving post data...');
            evt.data.adminRef.root.child(`/posts/${postUid}`).once(`value`, (post) => {
                console.log('Post data received!');
                if (post.val()) {
                    // Post exists
                    console.log('Post exists... Retrieving user favorites...');
                    evt.data.adminRef.root.child(`/user_favorites/${userUid}/posts/${postUid}`).once(`value`, (favorite) => {
                        console.log('Favorite data received!');
                        if (favorite.val()) {
                            favorite.ref.set(null).then(() => resolve('Favorite removed!'));
                        } else {
                            favorite.ref.set(true).then(() => resolve('Favorite added!'));
                        }
                    });
                } else {
                    // Post doesnt exist
                    reject(`Post ${postUid} does not exist. Not favoriting`);
                }
            });
        } else {
            reject('Insufficient data');
        }
    }).then((r) => {
        console.log('Favorite | Finished: ' + r);
        return evt.data.ref.remove();
    }, (e) => {
        console.log('Favorite | Exited: ' + e);
        return evt.data.ref.remove();
    });
}

module.exports = {
    processFavorite: processFavorite
};