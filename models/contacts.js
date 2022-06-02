const Crud = require('../modules/crud');

class Contact extends Crud {
    id = -1;
    firstName = "";
    lastName = "";
    email = "";
    userid = "";
    sender = "";
    intent = 0;

    constructor(firstName, lastName, email, userid, sender, intent) {
        super();
        this.set({ firstName, lastName, email, userid, sender, intent });
    }

    set({ firstName, lastName, email, userid, sender, intent, id }) {
        if (firstName !== undefined) this.firstName = firstName;
        if (lastName !== undefined) this.lastName = lastName;
        if (email !== undefined) this.email = email;
        if (userid !== undefined) this.userid = userid;
        if (sender !== undefined) this.sender = sender;
        if (intent !== undefined) this.intent = intent;
        if (id !== undefined) this.id = id;
    }
}

module.exports = Contact;