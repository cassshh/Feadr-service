'use strict';

function processNewPost(evt) {
    console.log('Processing new post');

    const post = evt.data.val();
    const postUid = evt.params.push;
    const promises = [];

    // Post is removed
    if (!post) {
        return console.log('Post removed from queue');
    }

    // Set time format
    if (post.time) {
        post.time = new Date(post.time).toISOString();
    }

    /*
     route: street,
     locality: city,
     administrative_area_level_1: state,
     administrative_area_level_2: county,
     country: country,
     postal_code: postal code
     */
    const searchLoc = ['route', 'locality', 'administrative_area_level_1', 'administrative_area_level_2', 'country', 'postal_code'];

    // Set location
    let location = {};
    if (post.location.address_components) {
        for (const address of post.location.address_components) {
            for (const type of address.types) {
                if (searchLoc.includes(type)) {
                    location[type] = {
                        long_name: address.long_name,
                        short_name: address.short_name,
                    };
                }
            }
        }
    }
    post.location.address_components = location;

    // Set overview object
    const overviewObject = {
        title: post.title,
        location: post.location,
        time: post.time,
        user_uid: post.user_uid,
        username: post.username,
    };

    // Set thumbnail if image(s)
    if (post.content) {
        for (const section of Object.keys(post.content)) {
            if (post.content[section].images) {
                // Make first image the thumbnail
                overviewObject.thumbnail = post.content[section].images[Object.keys(post.content[section].images)[0]];
                break;
            }
        }
    }

    // Process tags
    if (post.tags) {
        for (const tag in post.tags) {
            // Strip tags so more tags fall under one node
            // wholesomememes | Wholesome Memes
            let tagname = post.tags[tag].replace(/\s+/g, '');
            tagname = tagname.toLowerCase();
            promises.push(evt.data.adminRef.root.child(`/tags/${tagname}/posts/${postUid}`).set(postUid));
        }
    }

    // Process locations
    for (const type in location) {
        promises.push(evt.data.adminRef.root.child(`/location/${type}/${location[type].long_name}/posts/${postUid}`).set(postUid));
    }

    promises.push(evt.data.adminRef.root.child(`/user_posts/${post.user_uid}/${postUid}`).set(postUid));
    promises.push(evt.data.adminRef.root.child(`/points/posts/${postUid}`).set({ upvotes: 0, downvotes: 0 }));
    promises.push(evt.data.adminRef.root.child(`/overview/${postUid}`).set(overviewObject));
    promises.push(evt.data.adminRef.root.child(`/posts/${postUid}`).set(post));

    return Promise.all(promises).then(() => {
        console.log('Post has been processed');
        return evt.data.ref.remove();
    });
}

module.exports = {
    processNewPost: processNewPost
};