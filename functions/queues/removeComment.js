'use strict';

function processRemoveComment(evt) {
    console.log('Processing removal comment');

    const postUid = evt.params.post;
    const commentUid = evt.data.val();
    const promises = [];

    // Comment is removed
    if (!commentUid) {
        return console.log('Comment removed from queue');
    }

    console.log('Retrieving comment data...');
    evt.data.adminRef.root.child(`/post_comments/${postUid}/${commentUid}`).once('value', (snapshot) => {
        if (snapshot.val()) {
            console.log('Data received!');
            console.log(snapshot.val());
            
            promises.push(snapshot.ref.set(null));
            promises.push(evt.data.adminRef.root.child(`/points/comments/${commentUid}`).set(null));

            const userUid = snapshot.val().user_uid;
            promises.push(evt.data.adminRef.root.child(`/user_post_comments/${userUid}/${postUid}/${commentUid}`).set(null));

        } else {
            console.log('No data found...');
        }
        return Promise.all(promises).then(() => {
            console.log('Comments removal has been processed');
            evt.data.ref.remove();
        });
    });
}

module.exports = {
    processRemoveComment: processRemoveComment
};