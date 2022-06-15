const Database = require('better-sqlite3');
const path = require('path');

class DB {
    db = undefined;
    connected = false;

    constructor(databasePath = '../db/database.db') { 
        this.connect(databasePath);
    }

    connect(databasePath = '../db/database.db') {
        this.db = new Database(path.join(__dirname, databasePath), { verbose: console.log });
    }

    async initializeScheduler() {
        if (!this.connected) {
            this.connect();
        }
    
        let configsTable = `CREATE TABLE IF NOT EXISTS 'settings' (
            'id' INTEGER,
            'name' TEXT,
            'type' TEXT,
            'value' TEXT,
            PRIMARY KEY('id' AUTOINCREMENT)
        );`;
    
        let flowsTable = `CREATE TABLE IF NOT EXISTS 'flows' (
            'id' INTEGER,
            'name' TEXT,
            'trigger' INTEGER,
            'step' INTEGER,
            'detail' TEXT,
            'created' TEXT,
            'status' TEXT,
            'active' TEXT,
            PRIMARY KEY('id' AUTOINCREMENT)
            FOREIGN KEY('trigger') REFERENCES triggers (id)
        );`;
        
        let triggersTable = `CREATE TABLE IF NOT EXISTS 'triggers' (
            'id' INTEGER,
            'name' TEXT,
            'conditions' TEXT,
            'config' TEXT,
            'type' TEXT,
            'created' TEXT,
            'active' INTEGER,
            PRIMARY KEY('id' AUTOINCREMENT)
        );`;
        // funnel_step_id, nombre, apellido, email, userid, sender, intent
        let contactsTable = `CREATE TABLE IF NOT EXISTS 'contacts' (
            'id' INTEGER,
            'first_name' TEXT,
            'last_name' TEXT,
            'email' TEXT,
            'user_id' TEXT,
            'sender' TEXT,
            'intent' INTEGER,
            'created' TEXT,
            'active' INTEGER,
            PRIMARY KEY('id' AUTOINCREMENT)
        );`;

        let configsInsert = `INSERT INTO settings (name, type, value) 
            VALUES
                ('wbi', 'text', '100156809383502'),
                ('pni', 'text', '111578454890042'),
                ('token', 'text', 'EAAIbR1eGZBdgBAA5TS5wJCZCvoB43VWr8UR2b9CMj9AN31GVaB7tRZAXUyFrseGYQlzrZBaSDEefa6ctzvoOCtSw4vdDwC0pwFZCDNMsG5PoYovoXufqU45kdAEa4R5ynW6zXMU1ZALxhT1tmJ4GnuxZCmYOwBoeD4lYe6PCLpHt3OJCZAcKKHSS'),
                ('auth', 'text', 'EAAIbR1eGZBdgBAA5TS5wJCZCvoB43VWr8UR2b9CMj9AN31GVaB7tRZAXUyFrseGYQlzrZBaSDEefa6ctzvoOCtSw4vdDwC0pwFZCDNMsG5PoYovoXufqU45kdAEa4R5ynW6zXMU1ZALxhT1tmJ4GnuxZCmYOwBoeD4lYe6PCLpHt3OJCZAcKKHSS'),
        `;
    
        let promises = [];
        for (let create of [configsTable, flowsTable, triggersTable, contactsTable, configsInsert]) {
            promises.push(new Promise((resolve, reject) => {
                let result = this.db.exec(create);
                resolve(result);
            }));
        }
    
        return (await Promise.all(promises)).indexOf(false) !== -1;
    }

    insert(model, tableName = '') {
        if (!this.connected) {
            this.connect();
        }
    
        let table = tableName !== '' ? tableName : (typeof model === 'function' ? model.name.toLowerCase() : model.constructor.name.toLowerCase());
        let columns = [];
        let values = [];
        let insert = [];

        for (let column in model) {
            if (['id', 'db', 'settings'].includes(column)) continue;

            columns.push(column);
            let value = '';
            if (typeof model[column] === 'object') {
                try { value = JSON.stringify(model[column]) } catch(err) {}
            } else {
                value = model[column];
            }
            values.push(value);
            insert.push('?');
        }

        let insertQuery = `INSERT INTO ${table} (${columns.join(', ')}) VALUES(${insert.join(', ')})`;
        
        let result = this.db.prepare(insertQuery).run(values);
        return this.find(model, 'id = ' + result.lastInsertRowid);
    }

    update(model, modelValues = '') {
        if (!this.connected) {
            this.connect();
        }
    
        let table = typeof model === 'function' ? model.name.toLowerCase() : model.constructor.name.toLowerCase();
        let update = [];
        let values = [];

        for (let column in (modelValues !== '' ? modelValues : model)) {
            if (['id', 'db', 'settings'].includes(column)) continue;

            update.push(column + ' = ?');
            let value = '';
            if (typeof model[column] === 'object') {
                try { value = JSON.stringify(model[column]) } catch(err) {}
            } else {
                value = model[column];
            }
            values.push(value);
        }

        let updateQuery = `UPDATE ${table} SET ${update.join(', ')} WHERE id = ${model.id}`;
        
        let result = this.db.prepare(updateQuery).run(values);
        return this.find(model, 'id = ' + (modelValues !== '' ? modelValues : model).id);
    }

    find(model, condition = '', custom = '') {
        if (!this.connected) {
            this.connect();
        }

        let table = (typeof model === 'function' ? model.name.toLowerCase() : model.constructor.name.toLowerCase());

        if (condition !== '') {
            condition = ' WHERE ' + condition;
        }
    
        return this.db.prepare(`SELECT * FROM ${table}${condition} ${custom}`).get();
    }

    all(model, condition = '') {
        if (!this.connected) {
            this.connect();
        }

        let table = (typeof model === 'function' ? model.name.toLowerCase() : model.constructor.name.toLowerCase());

        if (condition !== '') {
            condition = ' WHERE ' + condition;
        }

        return this.db.prepare(`SELECT * FROM ${table}${condition}`).all();
    }

    remove(model, condition) {
        if (!this.connected) {
            this.connect();
        }

        let table = (typeof model === 'function' ? model.name.toLowerCase() : model.constructor.name.toLowerCase());

        if (condition !== '') {
            condition = ' WHERE ' + condition;
        }

        return this.db.prepare(`DELETE FROM ${table}${condition}`).run();
    }

    query(query) {
        if (!this.connected) {
            this.connect();
        }
        return this.db.exec(query);
    }
}


module.exports = new DB();