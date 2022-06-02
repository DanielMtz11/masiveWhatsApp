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
    
        let configsTable = `CREATE TABLE IF NOT EXISTS "settings" (
            "id" INTEGER,
            "name" TEXT,
            "type" TEXT,
            "value" TEXT,
            PRIMARY KEY("id" AUTOINCREMENT)
        );`;
    
        let flowsTable = `CREATE TABLE IF NOT EXISTS "flows" (
            "id" INTEGER,
            "name" TEXT,
            "active" TEXT,
            "detail" TEXT,
            "created" TEXT,
            PRIMARY KEY("id" AUTOINCREMENT)
        );`;
        
        let triggersTable = `CREATE TABLE IF NOT EXISTS "triggers" (
            "id" INTEGER,
            "name" TEXT,
            "conditions" TEXT,
            "flow" INTEGER,
            "step" INTEGER,
            "status" TEXT,
            "active" INTEGER,
            PRIMARY KEY("id" AUTOINCREMENT),
            FOREIGN KEY("flow") REFERENCES flows (id)
        );`;
        // funnel_step_id, nombre, apellido, email, userid, sender, intent
        let contactsTable = `CREATE TABLE IF NOT EXISTS "contacts" (
            "funnel_step_id" INTEGER,
            "nombre" TEXT,
            "apellido" TEXT,
            "email" TEXT,
            "userid" TEXT,
            "sender" TEXT,
            "intent" INTEGER,
            PRIMARY KEY("funnel_step_id" AUTOINCREMENT)
        );`;
    
        let promises = [];
        for (let create of [configsTable, flowsTable, triggersTable, contactsTable]) {
            promises.push(new Promise((resolve, reject) => {
                this.db.run(create, [], (result, err) => {
                    if (err) {
                        console.error('Initialize database', err);
                        return resolve(false);
                    }
                    return resolve(true);
                });
            }));
        }
    
        return (await Promise.all(promises)).indexOf(false) !== -1;
    }

    async insert(model, tableName = "") {
        if (!this.connected) {
            await this.connect();
        }
    
        let table = tableName !== "" ? tableName : (typeof model === "function" ? model.name.toLowerCase() : model.constructor.name.toLowerCase());
        let columns = [];
        let values = [];
        let insert = [];

        for (let column in model) {
            if (['id', 'db', 'settings'].includes(column)) continue;

            columns.push(column);
            values.push(model[column]);
            insert.push('?');
        }

        let insertQuery = `INSERT INTO ${table} (${columns.join(', ')}) VALUES(${insert.join(', ')})`;
        
        return await new Promise((resolve, reject) => {
            this.db.run(insertQuery, values, (result, err) => {
                if (err) {
                    console.error('Error inserting', err, product);
                    return resolve(false);
                }

                return resolve(true);
            });
        });
    }

    async update(model, tableName = "") {
        if (!this.connected) {
            await this.connect();
        }
    
        let table = tableName !== "" ? tableName : (typeof model === "function" ? model.name.toLowerCase() : model.constructor.name.toLowerCase());
        let update = [];
        let values = [];

        for (let column in model) {
            if (['id', 'db', 'settings'].includes(column)) continue;

            update.push(column + ' = ?');
            values.push(model[column]);
        }

        let updateQuery = `UPDATE ${table} SET ${update.join(', ')} WHERE id = ${model.id}`;
        
        return await new Promise((resolve, reject) => {
            this.db.run(updateQuery, values, (result, err) => {
                if (err) {
                    console.error('Error inserting', err, product);
                    return resolve(false);
                }

                return resolve(true);
            });
        });
    }

    async find(model, condition = "") {
        let table = (typeof model === "function" ? model.name.toLowerCase() : model.constructor.name.toLowerCase());

        if (condition !== "") {
            condition = " WHERE " + condition;
        }
    
        return await new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM ${table}${condition}`, [], (err, data) => {
                if (err || data === undefined) {
                    console.error('Error trying to find a row', err);
                    return resolve(false);
                }
    
                return resolve(data);
            });
        });
    }

    async all(model, condition = "") {
        let table = (typeof model === "function" ? model.name.toLowerCase() : model.constructor.name.toLowerCase());

        if (condition !== "") {
            condition = " WHERE " + condition;
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
        let table = (typeof model === "function" ? model.name.toLowerCase() : model.constructor.name.toLowerCase());

        if (condition !== "") {
            condition = " WHERE " + condition;
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
}


module.exports = new DB();