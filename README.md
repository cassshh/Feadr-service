# Feadr-service
Feadr Service


**Posts**
```JavaScript
let data;

// action == 'create'
data = {
    content: {
        $sections: {
            images: {
                $img: url,
            },
            text: text,
        },
    },
    location: google.maps.places.PlaceResult,
    tags: {
        $t: tag
    }
    title: title,
};

// action == 'remove'
data = {
    post_uid: post_uid,
};

// Replace params with correct values
// action = 'create' || 'remove'
ref('queue/posts/{action}').push(data);
```


**Comments**
```JavaScript
let data;

// action == 'create'
data = {
    post_uid: post_uid,
    text: text,
    time: firebase.database.ServerValue.TIMESTAMP,
    user_uid: user_uid,
    username: username,
};

// action == 'remove'
data = {
    post_uid: post_uid,
    comment_uid: comment_uid,
};

// Replace params with correct values
// action = 'create' || 'remove'
ref('queue/comments/{action}').push(data);
```

**Voting**
```JavaScript
const data = {
    type_uid: type_uid, // uid of the type
    user_uid: user_uid,
};

// Replace params with correct values
// type = 'post' || 'comment'
// action = 'upvote' || 'downvote'
ref('queue/votes/{type}/{action}').push(data);
```

**Favoriting**
```JavaScript
const data = {
    post_uid: post_uid,
};

ref('queue/favorites').push(data);
```