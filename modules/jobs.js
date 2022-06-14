const ns = require('node-schedule');

const Flows = require('../models/flows');
const Trigger = require('../models/triggers');

const getContact = () => {
    console.log("Getting contact...");
}

const flowExecuter = async () => {
    let flows = await Flows.list(1);
    let triggers = await Trigger.list(1);

    for (let flow of flows) {
        let trigger = triggers.find(item => item.id == flow.trigger);
        trigger.conditions = JSON.parse(trigger.conditions);
        trigger.config = JSON.parse(trigger.config);

        flow.detail = JSON.parse(flow.detail);
        flow.status = JSON.parse(flow.status);
        flow.trigger = trigger;
    }

    console.log(flows);
}

module.exports = { getContact, flowExecuter };