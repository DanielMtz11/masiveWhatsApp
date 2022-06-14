const Crud = require('../modules/crud');
let db = require('../db/db');

class Settings extends Crud {
    constructor() {
        super();
    }

    async add(name, type, value) {
        return await db.insert({ name, type, value }, 'settings');
    }

    async modify(name, value) {
        let setting = await db.find(this, 'name = "' + name + '"');
        if (!this.validate(setting['type'], value)) {
            return false;
        }

        return await db.update(this, {
            id: setting['id'],
            value
        }, 'settings');
    }

    async get(name) {
        return await db.find(this, 'name = "' + name + '"');
    }

    validate(type, value) {
        switch (type) {
            case 'number':
                return !isNaN(Number(value));
            case 'text':
                return typeof value === 'string';
            case 'json':
                try {
                    JSON.stringify(value);
                    return true;
                } catch(err) {
                    return false;
                }
        }
    }
}

module.exports = Settings;