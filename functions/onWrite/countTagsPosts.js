module.exports = class CountTagsPosts {
    constructor(config) {
    }

    onTrigger() {
        return event => startProcess(this, event);
    }
};

// Start Process
function startProcess(obj, event) {

    const countRef = event.data.ref.parent.parent.parent.parent.child('count').child(event.params.tag);
    // Return the promise from countRef.transaction() so our function 
    // waits for this async event to complete before it exits.
    return countRef.transaction(current => {
        if (event.data.exists() && !event.data.previous.exists()) {
            return (current || null) + 1;
        }
        else if (!event.data.exists() && event.data.previous.exists()) {
            if (current > 1) {
                return (current || null) - 1;
            }
            return null;
        }
    }).then(() => {
        console.log('Location Posts count updated');
    });
}