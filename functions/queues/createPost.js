'use strict';

function processNewPost(evt) {
    console.log('New post | Starting');

    return new Promise((resolve, reject) => {
        const data = evt.data.val();
        const postUid = evt.params.push;

        // Check if removed
        if (!data) {
            return resolve('Removed from queue');
        }

        // Check on auth
        if (evt.auth.admin) {
            // Is admin
            return reject('Admin user');
        } else if (!evt.auth.variable) {
            // Un-auth user
            return reject('Non authorized user');
        }

        const userUid = evt.auth.variable.uid;

        if (data.location && data.location.address_components && data.title && data.content && userUid) {

            const promises = [];

            /*
            route: street,
            neighborhood: neighborhood,
            locality: city,
            administrative_area_level_1: state,
            administrative_area_level_2: county,
            country: country,
            postal_code: postal code
            */
            const searchLoc = ['route', 'neighborhood', 'locality', 'administrative_area_level_1', 'administrative_area_level_2', 'country', 'postal_code'];

            let location = {};
            const address_components = data.location.address_components;
            for (const address of address_components) {
                for (const type of address.types) {
                    if (searchLoc.includes(type)) {
                        location[type] = {
                            long_name: address.long_name,
                            short_name: address.short_name,
                        };
                    }
                }
            }

            // Set new values
            data.location.address_components = location;
            data.user_uid = userUid;
            data.time = new Date().toISOString();

            // Create overview object
            const overviewObject = {
                title: data.title,
                location: data.location,
                time: data.time,
                user_uid: data.user_uid,
            };

            // Set thumbnail if image(s)
            let thumbnail;
            for (const section in data.content) {
                if (data.content[section].images) {
                    // Make first image the thumbnail
                    overviewObject.thumbnail = data.content[section].images[Object.keys(data.content[section].images)[0]];
                    break;
                }
            }


            // Process tags
            if (data.tags) {
                for (let tag in data.tags) {
                    // Strip tags so more tags fall under one node
                    // wholesomememes | Wholesome Memes
                    tag = data.tags[tag].replace(/[&\/\\#,+()$@^~%.'";:*?!<>{}]/g, ''); //Remove special chars
                    tag = tag.replace(/\s+/g, '').toLowerCase(); // Remove spaces & to lower case
                    
                    promises.push(evt.data.adminRef.root.child(`/tags/${tag}/posts/${postUid}`).set(true));
                    promises.push(evt.data.adminRef.root.child(`/tags_count/${tag}`).transaction((count) => {
                        if(count === null || isNaN(count)) {
                            count = 1;
                        } else {
                            count++;
                        }
                        return count;
                    }));
                }
            }

            // Process locations
            for (const type in location) {
                promises.push(evt.data.adminRef.root.child(`/location/${type}/${location[type].long_name}/posts/${postUid}`).set(true));
                promises.push(evt.data.adminRef.root.child(`/location_count/${type}/${location[type].long_name}`).transaction((count) => {
                    if (count === null || isNaN(count)) {
                        count = 1;
                    } else {
                        count++;
                    }
                    return count;
                }));
            }

            promises.push(evt.data.adminRef.root.child(`/user_posts/${data.user_uid}/${postUid}`).set(true));
            promises.push(evt.data.adminRef.root.child(`/votes/posts/${postUid}`).set({ upvotes: 0, downvotes: 0 }));
            promises.push(evt.data.adminRef.root.child(`/overview/${postUid}`).set(overviewObject));
            promises.push(evt.data.adminRef.root.child(`/posts/${postUid}`).set(data));
            promises.push(evt.data.adminRef.root.child(`/posts_ids/${postUid}`).set(true));
            
            return Promise.all(promises).then((r) => {
                return resolve('Post created!');
            }, (e) => {
                return reject(e);
            });

        } else {
            return reject('Insufficient data');
        }
    }).then((r) => {
        console.log('New post | Finished: ' + r);
        return evt.data.ref.remove();
    }, (e) => {
        console.error(e);
        return evt.data.ref.remove();
    });
}

module.exports = {
    processNewPost: processNewPost
};