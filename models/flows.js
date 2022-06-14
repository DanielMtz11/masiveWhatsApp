const Crud = require('../modules/crud');

class Flows extends Crud {
    id = '';
    name = '';
    step = '';
    detail = '{}';
    status = '{}'
    active = 1;
    trigger = '';
    created = '';

    constructor({name, trigger, step, detail, created, status, active}) {
        super();
        if (created === undefined) {
            created = (new Date()).getTime();
        }

        this.set({ name, trigger, step, detail, created, status, active });
    }
    
    set({ name, trigger, step, detail, created, status, active, id }) {
        if (id !== undefined) this.id = id;
        if (name !== undefined) this.name = name;
        if (step !== undefined) this.step = step;
        if (detail !== undefined) {
            try { detail = JSON.parse(detail); } catch(err) {}
            this.detail = detail;
        }
        if (status !== undefined) {
            try { status = JSON.parse(status); } catch(err) {}
            this.status = status;
        }
        if (active !== undefined) this.active = active;
        if (trigger !== undefined) this.trigger = trigger;
        if (created !== undefined) this.created = created;
    }
}

module.exports = Flows;