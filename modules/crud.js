const db = require('../db/db');

class Crud {
    async list(active = 1) {
        return db.all(this, 'active = ' + active);
    }

    async find(name) {
        return db.find(this, 'name = \'' + name + '\'');
    }

    async save() {
        let result = {};

        if (this.id !== "") {
            result = db.update(this);
        } else {
            result = db.insert(this);
        }

        if (result && result.id !== undefined) {
            this.set(result);
            return true;
        }

        return false;
    }

    async update() {
        let result = db.update(this);
       
        if (result && result.id !== undefined) {
            this.set(result);
            return true;
        }

        return false;
    }

    async remove() {
        return db.remove(this, 'id = ' + this.id);
    }

    static async findById(id) {
        let data = (db.find(this, 'id = \'' + id + '\'')) || {};
        if (data.id !== undefined) {
            return this.build(data);
        }
        return;
    }

    static async find(name) {
        let data = (db.find(this, 'name = \'' + name + '\'')) || {};
        if (data.id !== undefined) {
            return this.build(data);
        }
        return;
    }

    static async findByCondition(condition) {
        let data = (db.find(this, condition)) || {};
        if (data.id !== undefined) {
            return this.build(data);
        }
        return;
    }

    static async list(active = 1) {
        return (db.all(this, active !== '' ? 'active = ' + active : '')) || [];
    }

    static async query(query) {
        return (db.query(query)) || [];
    }

    static async build(data) {
        let instance = new this(data);
        instance.set({ id: data.id });
        return instance;
    }
}

module.exports = Crud;