module.exports = class CreatePost {
    constructor(config) {
        if (!config.pathPosts) {
            throw 'config.pathPosts string missing. Looks like "/posts"';
        }
        if (!config.pathOverview) {
            throw 'config.pathOverview string missing. Looks like "/overview"';
        }
        if (!config.pathLocation) {
            throw 'config.pathLocation string missing. Looks like "/location"';
        }
        if (!config.pathTags) {
            throw 'config.pathTags string missing. Looks like "/tags"';
        }
        if (!config.pathUserData) {
            throw 'config.pathUserData string missing. Looks like "/user_data"';
        }
        if (!config.pathPostVotes) {
            throw 'config.pathPostVotes string missing. Looks like "/posts/votes"';
        }
        if (!config.pathPostFavorites) {
            throw 'config.pathPostFavorites string missing. Looks like "/posts/favorites"';
        }
        if (!config.pathPostComments) {
            throw 'config.pathPostComments string missing. Looks like "/posts/comments"';
        }
        this.pathPosts = config.pathPosts;
        this.pathOverview = config.pathOverview;
        this.pathLocation = config.pathLocation;
        this.pathTags = config.pathTags;
        this.pathUserData = config.pathUserData;
        this.pathPostVotes = config.pathPostVotes;
        this.pathPostFavorites = config.pathPostFavorites;
        this.pathPostComments = config.pathPostComments;
    }

    onTrigger() {
        return event => startProcess(this, event)
            .then(result => {
                console.log('Finished! ' + result);
                return event.data.ref.remove();
            }, error => {
                console.log('Errored');
                console.log(error);
                return event.data.ref.remove();
            });
    }
};

// Start Process
function startProcess(obj, event) {
    console.log('Creating Post | Starting...');
    return new Promise((resolve, reject) => {

        const payload = event.data.val();
        const uid = event.params.uid;
        const user = event.auth;

        if (!payload) return resolve('Removed from queue');

        // Check on auth
        if (user.admin) {
            // Is admin
            return reject('Admin user');
        } else if (!user.variable) {
            // Un-auth user
            return reject('Non authorized user');
        }

        const userID = user.variable.uid;

        return createPostObject(payload, userID).then(post => {
            return Promise.all([
                createPost(obj, post, uid, event),
                createOverview(obj, post, uid, event),
                createLocation(obj, post, uid, event),
                createTags(obj, post, uid, event),
                createUserRef(obj, post, uid, event),
                createVotes(obj, uid, event),
                createFavorites(obj, uid, event),
                createComments(obj, uid, event)
            ]).then((r) => {
                return resolve('Post created!');
            });
        });
    });
}

// Sanitize Post Object
function createPostObject(payload, userID) {
    return new Promise((resolve, reject) => {
        /*
        route: street,
        neighborhood: neighborhood,
        locality: city,
        administrative_area_level_1: state,
        administrative_area_level_2: county,
        country: country,
        postal_code: postal code
        */
        const locationTypes = ['route', 'neighborhood', 'locality', 'administrative_area_level_1', 'administrative_area_level_2', 'country', 'postal_code'];

        let location = {};
        const address_components = payload.location.address_components;
        for (const address of address_components) {
            for (const type of address.types) {
                if (locationTypes.includes(type)) {
                    location[type] = {
                        long_name: address.long_name,
                        short_name: address.short_name,
                    };
                }
            }
        }

        // Set new values
        payload.location.address_components = location;
        payload.user_uid = userID;
        payload.time = new Date().toISOString();

        return resolve(payload);
    });
}

// Process Post
function createPost(obj, post, postID, event) {
    const data = event.data.adminRef.root.child(obj.pathPosts).child('data').child(postID).set(post);
    const id = event.data.adminRef.root.child(obj.pathPosts).child('ids').child(postID).set(true);
    //const count = increment(event.data.adminRef.root.child(obj.pathPosts).child('count'));
    return Promise.all([data, id]);
}

// Process Overview
function createOverview(obj, post, postID, event) {
    const overview = {
        title: post.title,
        time: post.time,
        location: post.location,
        user_uid: post.user_uid,
    };

    // Set thumbnail if image(s)
    for (const section in post.content) {
        if (post.content[section].images) {
            // Make first image the thumbnail
            overview.thumbnail = post.content[section].images[Object.keys(post.content[section].images)[0]];
            break;
        }
    }

    if (post.tags) {
        overview.tags = post.tags;
    }

    return event.data.adminRef.root.child(obj.pathOverview).child(postID).set(overview);
}

// Process Location
function createLocation(obj, post, postID, event) {
    // Process locations
    const promises = [];
    const location = post.location.address_components;
    for (const type in location) {
        promises.push(event.data.adminRef.root.child(obj.pathLocation).child('data').child(type).child(location[type].long_name).child('posts').child(postID).set(true));
        //promises.push(increment(event.data.adminRef.root.child(obj.pathLocation).child('count').child(type).child(location[type].long_name)));
    }
    return Promise.all(promises);
}

// Process Tags
function createTags(obj, post, postID, event) {
    // Process tags

    if (!post.tags) return resolve();
    const promises = [];
    const tags = post.tags;
    for (let tag in tags) {
        // Strip tags so more tags fall under one node
        tag = tags[tag].replace(/[&\/\\#,+()$@^~%.'";:*?!<>{}]/g, ''); //Remove special chars
        tag = tag.replace(/\s+/g, '').toLowerCase(); // Remove spaces & to lower case

        promises.push(event.data.adminRef.root.child(obj.pathTags).child('data').child(tag).child('posts').child(postID).set(true));
        //promises.push(increment(event.data.adminRef.root.child(obj.pathTags).child('count').child(tag)));
    }
    return Promise.all(promises);
}

// Process User-ref
function createUserRef(obj, post, postID, event) {
    const data = event.data.adminRef.root.child(obj.pathUserData).child(post.user_uid).child('posts').child('data').child(postID).set(true);
    //const count = increment(event.data.adminRef.root.child(obj.pathUserData).child(post.user_uid).child('posts').child('count'));
    return Promise.all([data]);
}

// Process Init Votes
function createVotes(obj, postID, event) {
    // return event.data.adminRef.root.child(obj.pathPostVotes).child(postID).child('count').set({
    //     upvotes: 0,
    //     downvotes: 0
    // });
}

// Process Init Favorites
function createFavorites(obj, postID, event) {
    // return event.data.adminRef.root.child(obj.pathPostFavorites).child(postID).child('count').set(0);
}

// Process Init Comments
function createComments(obj, postID, event) {
    // return event.data.adminRef.root.child(obj.pathPostComments).child(postID).child('count').set(0);
}

// Increment counts
function increment(ref) {
    return ref.transaction((count) => {
        if (count !== null) {
            count++;
        } else {
            count = 1;
        }
        return count;
    });
}