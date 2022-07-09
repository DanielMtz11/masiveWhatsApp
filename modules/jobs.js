const ns = require('node-schedule');
const WB = require('./whatsapp');
const logger = require('./logger');
const MySQLEvents = require('@rodrigogs/mysql-events');

const Flows = require('../models/flows');
const Triggers = require('../models/triggers');
const Settings = require('../models/settings');
const connections = {};

const testConnection = async config => {
    let host = config.host;
    let password = config.pass;

    let instance = new MySQLEvents({
        host,//'147.185.238.85',
        user: 'ws-scheduler',
        password,
    }, {
        startAtEnd: true,
    });

    try {
        await instance.start();
        instance.stop();
        return { result: true, detail: 'Ok' };
    } catch (err) {
        return { result: false, detail: err };
    }
}

const getContact = () => {
    logger.info("Getting contact...");
}

const getNewDelayDate = (data) => {
    let date = new Date();
    switch (data.unit) {
        case 'seconds':
            date.setSeconds(date.getSeconds() + Number(data.value));
            break;
        case 'minutes':
            date.setMinutes(date.getMinutes() + Number(data.value));
            break;
        case 'hours':
            date.setHours(date.getHours() + Number(data.value));
            break;
        case 'days':
            date.setDate(date.getDate() + Number(data.value));
            break;
        case 'weeks':
            date.setDate(date.getDate() + Math.round((Number(data.value) / 7)));
            break;
        case 'months':
            date.setMonth(date.getMonth() + Number(data.value));
            break;
    }

    return date;
}

const executeStep = async (flow, step, data) => {
    logger.info('Flow', flow.id, 'Step', step.id, 'is a', step.type);
    switch(step.type) {
        case 'message':
            logger.info('Starting step', flow.id + '.' + step.id, 'sending a message');
            
            let settings = new Settings();
            let wbi = await settings.get('wbi');
            let pni = await settings.get('pni');
            let auth = await settings.get('auth');
        
            let wb = new WB({ 
                authToken: auth.value, 
                phoneNumberID: pni.value, 
                whatsappBusinessID: wbi.value
            });
            
            let response = await wb.sendTextMessage(data.sender, step.data.value);
            logger.info('Sending message response:', response);
            break;
        case 'template':
            logger.info('Starting step', flow.id + '.' + step.id, 'sending a template');
            break;
        case 'delay':
            date = getNewDelayDate(step.data)
            logger.info('Starting step', flow.id + '.' + step.id, 'waiting until', date.toString());
            ns.scheduleJob(date, function(flowJob, stepJob, dataJob) {
                logger.info('Waiting step', flowJob.id + '.' + stepJob.id, 'finished');
                executeFlow(flowJob, dataJob);
            }.bind(null, flow, step, data));
            break;
    }
}

const executeFlow = async (flow, data) => {
    flow = JSON.parse(JSON.stringify(flow));
    flow.status = 'running';

    let steps = [...flow.steps];
    if (flow.step !== '') {
        steps = steps.map((item, index) => {
            item = {...item};
            if (index <= Number(flow.step.id)) {
                item.executed = true;
            }

            return item;
        });
    }

    for (let id in steps) {
        let step = steps[id];
        if (step.type === 'trigger' || step.executed === true) continue;


        logger.info('Executing Step', id, 'Of Flow', flow.id);
        flow.step = {
            start: (new Date()).getTime(),
            id, 
            ...step
        }
        await executeStep(flow, flow.step, data);
        if (step.type === 'delay') {
            flow.status = 'waiting';
            break;
        }
    }

    if (flow.status !== 'waiting') {
        flow.status = 'idle';
        flow.step = '';
    }
}

const executeFlowsTrigger = async (triggerId, data) => {
    let flows = await Flows.listByCondition('active = 1 AND trigger = ' + triggerId);
    for (let flow of flows) {
        if (flow.status != 'idle') continue;
        let flowObject = new Flows({});
        flow.step = '';
        flowObject.set(flow);
        logger.info('Executing Flow', flow.id);
        executeFlow(flowObject, data);
    }
}

const validateQuestion = (value, question, expected) => {
    switch (question) {
        case 'equals':
            return value == expected;
        case 'starts':
            return value.toLowerCase().indexOf(expected.toLowerCase()) === 0;
        case 'contains':
            return value.toLowerCase().indexOf(expected.toLowerCase()) !== -1;
        case 'ends':
            return (value.toLowerCase().indexOf(expected.toLowerCase()) + expected.length) === value.length;
    }

    return false;
}

const validateConditions = (row, conditions) => {
    for (let index in conditions) {
        let condition = conditions[index];

        let result = validateQuestion(row[condition.column], condition.question, condition.value);
        
        if (index === (conditions.length - 1)) {
            return result;
        }
        if (!result && condition.connector === 'and') {
            return false;
        }
        if (result && condition.connector === 'or') {
            return true;
        }
    }

    return true;
}

const initializeEventTrigger = async trigger => {
    let host = trigger.config.host;
    let password = trigger.config.pass;
    let database = trigger.config.database;
    let table = trigger.config.table;

    let event = MySQLEvents.STATEMENTS.INSERT;
    if (trigger.config.when === 'delete') {
        event = MySQLEvents.STATEMENTS.DELETE;
    } else if (trigger.config.when === 'update') {
        event = MySQLEvents.STATEMENTS.UPDATE;
    }

    if (connections[trigger.name] && connections[trigger.name].failTime && ((new Date()).getTime() - connections[trigger.name].failTime) < 600000) {
        return;
    }

    if (!connections[trigger.name] || 
        (connections[trigger.name] && (
            (connections[trigger.name].connection.state && connections[trigger.name].connection.state !== 'authenticated') ||
             (!connections[trigger.name].expressions[database + '.' + table] || !connections[trigger.name].expressions[database + '.' + table].statements[event] || !connections[trigger.name].expressions[database + '.' + table].statements[event][0])
        ))) {
        
        try {
            if (!connections[trigger.name] || connections[trigger.name].connection.state !== 'authenticated') {
                let lastErrrorCount = connections[trigger.name] ? connections[trigger.name].errors || 0 : 0;
                connections[trigger.name] = new MySQLEvents({
                    host,//'147.185.238.85',
                    user: 'ws-scheduler',
                    password,
                }, {
                    startAtEnd: true,
                });
                connections[trigger.name].errors = lastErrrorCount;

                logger.info('Testing Trigger', trigger.id, 'Connection', trigger.config);
                await connections[trigger.name].start();
                trigger.error = '';
                trigger.update();
                logger.info('Testing Trigger', trigger.id, 'Connection OK');

                connections[trigger.name].errors = 0;
            }

            try {
                connections[trigger.name].removeTrigger({
                    name: Object.keys(Object.values(connections[trigger.name].expressions).pop().statements).pop(),
                    expression: Object.keys(connections[trigger.name].expressions).pop(),
                    statement: Object.keys(Object.values(connections[trigger.name].expressions).pop().statements).pop()
                });
            } catch (err) {}

            connections[trigger.name].addTrigger({
                name: trigger.config.when.toUpperCase(),
                expression: database + '.' + table,
                statement: event,
                onEvent: async function (triggerEvent, event) {
                    logger.info('Mysql Event', event.type);
                    let id = triggerEvent.id;
                    let localTrigger = await Triggers.findById(id);
                    let row = event.affectedRows[0].after;
                    if (event.type === 'DELETE') {
                        row = event.affectedRows[0].before;
                    }

                    let result = validateConditions(row, localTrigger.conditions);
                    if (result) {
                        executeFlowsTrigger(id, row);
                    }
                }.bind(null, trigger)
            });

            connections[trigger.name].on(MySQLEvents.EVENTS.CONNECTION_ERROR, (err) => {
                logger.error('CONN ERROR', trigger.name, err);
                delete connections[trigger.name];
            });
            
            connections[trigger.name].on(MySQLEvents.EVENTS.ZONGJI_ERROR, (err) => {
                logger.error('ZONGJI ERROR', trigger.name, err);
                delete connections[trigger.name];
            });
        } catch (err) {
            logger.error('Trigger', trigger.id, 'Connection FAIL', err);
            if (connections[trigger.name].errors === 5) {
                trigger.error = JSON.stringify(err);
                await trigger.update();
                connections[trigger.name].failTime = (new Date()).getTime();
            }

            connections[trigger.name].errors += 1;
            logger.info('ERROR', trigger.name, err);
        }
    }
}

const flowExecuter = async () => {
    let triggers = await Triggers.list(1);

    for (let trigger of triggers) {  
        let triggerObject = new Triggers({});
        triggerObject.set(trigger);

        if (triggerObject && triggerObject.type === 'mysql') {
            initializeEventTrigger(triggerObject);
        }
    }
}

module.exports = { testConnection, getContact, flowExecuter };