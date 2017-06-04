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
    time: firebase.database.ServerValue.TIMESTAMP,
    title: title,
    user_uid: user_uid,
    username: username,
};

// action == 'remove'
data = {
    post_uid: post_uid,
};


// Replace action with your action.
ref('/queue/posts/{action}').push(data);
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


// Replace action with your action.
ref('/queue/comments/{action}').push(data);
```