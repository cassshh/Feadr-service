'use strict';

const admin = require('firebase-admin');

function processNewUser(evt) {
    console.log('Processing new user...');
    const user = evt.data;
    return admin.database().ref('users/' + user.uid).set(user);
}

module.exports = {
  processNewUser: processNewUser
};