const Crud = require('../modules/crud');

class Triggers extends Crud {
    id = '';
    name = '';
    type = '';
    error = '';
    active = 0;
    config = '{}';
    created = '';
    conditions = '[]';

    constructor({name, conditions, config, type, active, created, error}) {
        super();
        if (created === undefined) {
            created = (new Date()).getTime();
        }
        this.set({ name, conditions, config, type, active, created, error });
    }

    set({ name, conditions, config, type, active, created, id, error }) {
        if (id !== undefined) this.id = id;
        if (name !== undefined) this.name = name;
        if (type !== undefined) this.type = type;
        if (error !== undefined) this.error = error;
        if (active !== undefined) this.active = active;
        if (config !== undefined) {
            try { config = JSON.parse(config); } catch(err) {}
            this.config = config;
        }
        if (created !== undefined) this.created = created;
        if (conditions !== undefined) {
            try { conditions = JSON.parse(conditions); } catch(err) {}
            this.conditions = conditions;
        }
    }
}

module.exports = Triggers;