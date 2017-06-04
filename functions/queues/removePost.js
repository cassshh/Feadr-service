'use strict';

function processRemovePost(evt) {
    console.log('Processing removal post');

    const postUid = evt.data.val();
    const promises = [];

    // Post is removed
    if (!postUid) {
        return console.log('Post removed from queue');
    }

    console.log('Retrieving post data...');
    evt.data.adminRef.root.child(`/overview/${postUid}`).once('value', (snapshot) => {
        console.log('Data received!');
        if (snapshot.val()) {
            console.log(snapshot.val());
            // TODO Remove images
            promises.push(evt.data.adminRef.root.child(`/posts/${postUid}`).set(null));
            promises.push(evt.data.adminRef.root.child(`/overview/${postUid}`).set(null));

            const userUid = snapshot.val().user_uid;
            promises.push(evt.data.adminRef.root.child(`/user_posts/${userUid}/${postUid}`).set(null));

            const address_components = snapshot.val().location.address_components;
            for (const comp of Object.keys(address_components)) {
                promises.push(evt.data.adminRef.root.child(`/location/${comp}/${address_components[comp].long_name}/posts/${postUid}`).set(null));
            }
        }
        return Promise.all(promises).then(() => {
            console.log('Post removal has been processed');
            evt.data.ref.remove();
        });
    });
}

module.exports = {
    processRemovePost: processRemovePost
};