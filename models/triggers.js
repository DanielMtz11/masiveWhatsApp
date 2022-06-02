const Crud = require('../modules/crud');

class Triggers extends Crud {
    id = -1;
    name = "";
    conditions = "";
    flow = "";
    step = "";
    status = "idle";
    active = 1;

    constructor(name, conditions, flow, step, status, active) {
        super();
        this.set({ name, conditions, flow, step, status, active });
    }

    set({ name, conditions, flow, step, status, active, id }) {
        if (name !== undefined) this.name = name;
        if (conditions !== undefined) this.conditions = conditions;
        if (flow !== undefined) this.flow = flow;
        if (step !== undefined) this.step = step;
        if (status !== undefined) this.status = status;
        if (active !== undefined) this.active = active;
        if (id !== undefined) this.id = id;
    }
}

module.exports = Triggers;