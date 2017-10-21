module.exports = class CreateUser {
    constructor(config) {
        if (!config.pathUsers) {
            throw 'config.pathUsers string missing. Looks like "/users"';
        }
        if (!config.database) {
            throw 'config.database is missing. You must pass in a valid database using admin.database()';
        }
        this.pathUsers = config.pathUsers;
        this.database = config.database;
    }

    getFunction() {
        return event => {
            // const functions = require('firebase-functions');

            const user = event.data;
            const userRef = this.database.ref(this.pathUsers).child(user.uid);

            return userRef.update(user);
        };
    }
};