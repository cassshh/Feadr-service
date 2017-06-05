'use strict';

function processVote(evt) {
    console.log('Processing new vote');

    const data = evt.data.val();
    const type = evt.params.type;
    const action = evt.params.action;

    const promises = [];

    // Comment is removed
    if (!data) {
        return console.log('Vote removed from queue');
    }

    const typeUid = data.type_uid;
    const userUid = data.user_uid;

    promises.push(evt.data.adminRef.root.child(`/user_votes/${userUid}/${type}s/${action}s/${typeUid}`).once('value', (snapshot) => {
        console.log('Current val: ' + snapshot.val());
        if (snapshot.val()) {
            // Exists, so un-up/downvote
            promises.push(snapshot.ref.set(null));
            promises.push(evt.data.adminRef.root.child(`/votes/${type}s/${typeUid}/${action}s`).transaction((vote) => {
                if (vote !== null) {
                    vote--;
                }
                return vote;
            }));
        } else {
            // Doenst exist, so up/downvote
            promises.push(snapshot.ref.set(true));
            promises.push(evt.data.adminRef.root.child(`/votes/${type}s/${typeUid}/${action}s`).transaction((vote) => {
                if (vote !== null) {
                    vote++;
                }
                return vote;
            }));
            // Check on counter-action
            const counterAction = action === 'upvote' ? 'downvote' : 'upvote';
            promises.push(evt.data.adminRef.root.child(`/user_votes/${userUid}/${type}s/${counterAction}s/${typeUid}`).once('value', (snapshot) => {
                if (snapshot.val()) {
                    promises.push(snapshot.ref.set(null));
                    promises.push(evt.data.adminRef.root.child(`/votes/${type}s/${typeUid}/${counterAction}s`).transaction((vote) => {
                        if (vote !== null) {
                            vote--;
                        }
                        return vote;
                    }));
                }
            }));
        }
    }));

    return Promise.all(promises).then(() => {
        console.log('Vote has been processed');
        return evt.data.ref.remove();
    });
}

module.exports = {
    processVote: processVote
};