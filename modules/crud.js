const db = require('../db/db');

class Crud {
    db = undefined;

    constructor() {
        this.db = db;
    }

    async list(active = 1) {
        return await this.db.all(this, 'active = ' + active);
    }

    async find(name) {
        return await this.db.find(this, 'name = "' + name + '"');
    }

    async save() {
        if (this.id !== "") {
            return await this.db.update(this);
        }
        return await this.db.insert(this);
    }

    async update() {
        return await this.db.update(this);
    }

    async remove() {
        return await this.db.remove(this, 'id = ' + this.id);
    }

    static async findById(id) {
        let data = (await db.find(this, 'id = "' + id + '"')) || {};
        if (data.id !== undefined) {
            return this.build(data);
        }
        return;
    }

    static async find(name) {
        let data = (await db.find(this, 'name = "' + name + '"')) || {};
        if (data.id !== undefined) {
            return this.build(data);
        }
        return;
    }

    static async findByCondition(condition) {
        let data = (await db.find(this, condition)) || {};
        if (data.id !== undefined) {
            return this.build(data);
        }
        return;
    }

    static async list(active = 1) {
        return (await db.all(this, active !== '' ? 'active = ' + active : '')) || [];
    }

    static async build(data) {
        let instance = new this(data.name, data.detail, data.created, data.active);
        instance.set({ id: data.id });
        return instance;
    }
}

module.exports = Crud;