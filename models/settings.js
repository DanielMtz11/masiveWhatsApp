const Crud = require('../modules/crud');

class Settings extends Crud {
    db = undefined;

    constructor() {
        super();
        this.db = require('../db/db');
    }

    async add(name, type, value) {
        return await this.db.insert({ name, type, value }, 'settings');
    }

    async modify(name, value) {
        let setting = await this.db.find(this, 'name = "' + name + '"');
        if (!this.validate(setting['type'], value)) {
            return false;
        }

        return await this.db.update({
            id: setting['id'],
            value
        }, 'settings');
    }

    async get(name) {
        return await this.db.find(this, 'name = "' + name + '"');
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