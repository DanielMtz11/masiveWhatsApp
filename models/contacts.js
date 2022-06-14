const Crud = require('../modules/crud');

class Contact extends Crud {
    id = '';
    email = '';
    sender = '';
    intent = '';
    active = 1;
    user_id = '';
    created = '';
    last_name = '';
    first_name = '';

    constructor({first_name, last_name, email, user_id, sender, intent, created, active}) {
        super();
        this.set({ first_name, last_name, email, user_id, sender, intent, created, active });
    }

    set({ first_name, last_name, email, user_id, sender, intent, created, active, id }) {
        if (id !== undefined) this.id = id;
        if (email !== undefined) this.email = email;
        if (sender !== undefined) this.sender = sender;
        if (intent !== undefined) this.intent = intent;
        if (active !== undefined) this.active = active;
        if (user_id !== undefined) this.user_id = user_id;
        if (created !== undefined) this.created = created;
        if (last_name !== undefined) this.last_name = last_name;
        if (first_name !== undefined) this.first_name = first_name;
    }
}

module.exports = Contact;