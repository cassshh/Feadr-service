'use strict';

function processRemovePost(evt) {
    console.log('Processing removal post');

    const post = evt.data.val();
    const promises = [];

    // Post is removed
    if (!post) {
        return console.log('Post removed from queue');
    }

    const postUid = post.post_uid;

    console.log('Retrieving post data...');
    evt.data.adminRef.root.child(`/posts/${postUid}`).once('value', (snapshot) => {
        if (snapshot.val()) {
            console.log('Data received!');
            console.log(snapshot.val());
            // TODO Remove images & comments
            promises.push(snapshot.ref.set(null));
            promises.push(evt.data.adminRef.root.child(`/overview/${postUid}`).set(null));
            promises.push(evt.data.adminRef.root.child(`/points/posts/${postUid}`).set(null));

            const userUid = snapshot.val().user_uid;
            promises.push(evt.data.adminRef.root.child(`/user_posts/${userUid}/${postUid}`).set(null));

            const tags = snapshot.val().tags;
            if (tags) {
                for (let tag in tags) {
                    tag = snapshot.val().tags[tag].replace(/[&\/\\#,+()$@^~%.'";:*?!<>{}\s+]/g, '');
                    tag = tag.toLowerCase();
                    promises.push(evt.data.adminRef.root.child(`/tags/${tag}/posts/${postUid}`).set(null));
                }
            }

            const address_components = snapshot.val().location.address_components;
            for (const comp in address_components) {
                promises.push(evt.data.adminRef.root.child(`/location/${comp}/${address_components[comp].long_name}/posts/${postUid}`).set(null));
            }
        } else {
            console.log('No data found...');
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