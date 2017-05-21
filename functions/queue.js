'use strict';

function processNewPost(evt = DeltaSnapShot) {
    console.log('Processing new post');
    const post = evt.data.val();
    const postUid = evt.params.postUid;

    if (!post) {
        return console.log('Post removed from queue');
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
            if (post.console[section].images) {
                // Make first image the thumbnail
                overviewObject.thumbnail = Object.values(post.content[section].images)[0];
                break;
            }
        }
    }

    const overviewPromise = admin.database().ref(`/overview/${postUid}`).set(overviewObject);
    const postPromise = admin.database().ref(`/posts/${postUid}`).set(post);

    return Promise.all([overviewPromise, postPromise]).then(() => {
        console.log('Post has been processed');
        return event.data.ref.remove();
    });
}

module.exports = {
    processNewPost: processNewPost
};