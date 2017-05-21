const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.createPost = functions.database.ref('/queue_create_post/{postUid}').onWrite(event => {
    console.log('Create Post called')
    const post = event.data.val();
    const postUid = event.params.postUid;

    if (!post) {
        return console.log('Post removed from queue');
    }

    console.log(post);

    const createOverviewItem = admin.database().ref('/overview/$postUid').set({
        user_uid: post.user_uid,
        username: post.username,
        title: post.title,
        thumbnail: post.thumbnail,
        time: post.time,
        location: post.location
    });
    const createPostItem = admin.database().ref('/posts/$postUid').set(post);

    return Promise.all([createOverviewItem, createPostItem]).then(results => {
        console.log('Post has been created')
        return event.ref().remove().then(result => {
            console.log('Removed from queue');
        });
    });
});