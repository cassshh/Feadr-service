'use strict';

function processNewComment(evt) {
    console.log('Processing new comment');
    
    const comment = evt.data.val();
    const commentUid = evt.params.push;
    const promises = [];

    // Comment is removed
    if (!comment) {
        return console.log('Comment removed from queue');
    }

    const postUid = comment.post_uid;

    // Set time format
    if (comment.time) {
        comment.time = new Date(comment.time).toISOString();
    }

    promises.push(evt.data.adminRef.root.child(`/post_comments/${postUid}/${commentUid}`).set(comment));
    promises.push(evt.data.adminRef.root.child(`/votes/comments/${commentUid}`).set({upvotes: 0, downvotes: 0}));
    promises.push(evt.data.adminRef.root.child(`/user_post_comments/${comment.user_uid}/${postUid}/${commentUid}`).set(commentUid));

    return Promise.all(promises).then(() => {
        console.log('Comment has been processed');
        return evt.data.ref.remove();
    });
}

module.exports = {
    processNewComment: processNewComment
};