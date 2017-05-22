'use strict';

function processNewPost(evt = DeltaSnapShot) {
    console.log('Processing new post');
    const post = evt.data.val();
    const postUid = evt.params.postUid;

    if (!post) {
        return console.log('Post removed from queue');
    }

    if (post.time) {
        post.time = new Date(post.time).toISOString();
    }

    const overviewObject = {
        title: post.title,
        location: post.location,
        time: post.time,
        user_uid: post.user_uid,
        username: post.username,
    }
    if (post.content) {
        for (let section of Object.keys(post.content)) {
            if (post.content[section].images) {
                // Make first image the thumbnail
                overviewObject.thumbnail = post.content[section].images[Object.keys(post.content[section].images)[0]];
                break;
            }
        }
    }

    const overviewPromise = evt.data.adminRef.root.child(`/overview/${postUid}`).set(overviewObject);
    const postPromise = evt.data.adminRef.root.child(`/posts/${postUid}`).set(post);

    return Promise.all([overviewPromise, postPromise]).then(() => {
        console.log('Post has been processed');
        return evt.data.ref.remove();
    });
}

module.exports = {
    processNewPost: processNewPost
};