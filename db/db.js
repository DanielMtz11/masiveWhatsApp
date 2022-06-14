const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DB {
    db = undefined;
    connected = false;

    constructor(databasePath = '../db/database.db') { 
        this.connect(databasePath);
    }

    async connect(databasePath = '../db/database.db') {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(path.join(__dirname, databasePath), (err) => {
                if (err) {
                    console.error(err.message);
                    return resolve(false);
                }
                console.info('Connected to the database.');
                this.connected = true;
                resolve(this.db);
            });
        });
    }

    async initializeScheduler() {
        if (!this.connected) {
            await this.connect();
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
    
        let promises = [];
        for (let create of [configsTable, flowsTable, triggersTable, contactsTable]) {
            promises.push(new Promise((resolve, reject) => {
                this.db.run(create, [], (result, err) => {
                    if (result && result.code) {
                        console.error('Initialize database', result);
                        return resolve(false);
                    }
                    return resolve(true);
                });
            }));
        }
    
        return (await Promise.all(promises)).indexOf(false) !== -1;
    }

    async insert(model, tableName = '') {
        if (!this.connected) {
            await this.connect();
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
        
        return await new Promise((resolve, reject) => {
            this.db.run(insertQuery, values, async (result, err) => {
                if (err) {
                    console.error('Error inserting', err, model);
                    return resolve(false);
                }

                return resolve(await this.find(model, '', 'ORDER BY id DESC LIMIT 1'));
            });
        });
    }

    async update(model, modelValues = '') {
        if (!this.connected) {
            await this.connect();
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
        
        return await new Promise((resolve, reject) => {
            this.db.run(updateQuery, values, async (result, err) => {
                if (err) {
                    console.error('Error inserting', err, model);
                    return resolve(false);
                }

                return resolve(await this.find(model, 'id = ' + (modelValues !== '' ? modelValues : model).id));
            });
        });
    }

    async find(model, condition = '', custom = '') {
        let table = (typeof model === 'function' ? model.name.toLowerCase() : model.constructor.name.toLowerCase());

        if (condition !== '') {
            condition = ' WHERE ' + condition;
        }
    
        return await new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM ${table}${condition} ${custom}`, [], (err, data) => {
                if (err || data === undefined) {
                    console.error('Error trying to find a row', err);
                    return resolve(false);
                }
    
                return resolve(data);
            });
        });
    }

    async all(model, condition = '') {
        let table = (typeof model === 'function' ? model.name.toLowerCase() : model.constructor.name.toLowerCase());

        if (condition !== '') {
            condition = ' WHERE ' + condition;
        }

        return await new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM ${table}${condition}`, [], (err, data) => {
                if (err || data === undefined) {
                    console.error('Error trying to get rows', err);
                    return resolve(false);
                }
    
                return resolve(data);
            });
        });
    }

    async remove(model, condition) {
        let table = (typeof model === 'function' ? model.name.toLowerCase() : model.constructor.name.toLowerCase());

        if (condition !== '') {
            condition = ' WHERE ' + condition;
        }

        return await new Promise((resolve, reject) => {
            this.db.run(`DELETE FROM ${table}${condition}`, [], (err, data) => {
                if (err) {
                    console.error('Error trying to delete ', err);
                    return resolve(false);
                }
    
                return resolve(true);
            });
        });
    }

    async query(query) {
        return await new Promise((resolve, reject) => {
            this.db.all(query, [], (err, data) => {
                if (err || data === undefined) {
                    console.error('Error trying to get rows', err);
                    return resolve(false);
                }
    
                return resolve(data);
            });
        });
    }
}


module.exports = new DB();