const Crud = require('../modules/crud');

class Flows extends Crud {
    id = -1;
    name = "";
    active = 1;
    detail = "";
    created = "";

    constructor(name, detail, created, active) {
        super();
        this.set({ name, detail, created, active });
    }
    
    set({ name, detail, created, active, id }) {
        if (name !== undefined) this.name = name;
        if (active !== undefined) this.active = active;
        if (detail !== undefined) this.detail = detail;
        if (created !== undefined) this.created = created;
        if (id !== undefined) this.id = id;
    }
}

module.exports = Flows;