const Triggers = require('../models/triggers');
const { testConnection } = require('../modules/jobs');

const page = async (req, res) => {
    let triggers = await Triggers.list('') || [];
    res.render('triggers', {
        title: 'WS Scheduler',
        selected: 'triggers',
        triggers,
        messages: req.flash()
    });
}

async function crudPage(req, res) {
    let id = req.params.id;

    let title = 'Trigger Builder';
    let trigger = {};
    if (id !== undefined) {
        trigger = await Triggers.findById(id);
        title += ' - ' + trigger.name;
        trigger.set({conditions: trigger.conditions});
    }

    res.render('crudTrigger', {
        title,
        trigger,
        messages: req.flash()
    });
}

async function crudTrigger(req, res) {
    let id = req.params.id;
    let { name, conditions, config, type } = req.body;

    let isConfigOk = await testConnection(config);
    if (!isConfigOk.result) {
        return res.json({ result: false, error: 'connection', detail: isConfigOk.detail });
    }

    if (name === undefined || conditions === undefined || config === undefined || type === undefined) {
        return res.json({ result: false });
    }

    let trigger = {};
    if (id !== undefined) {
        trigger = await Triggers.findById(id);
        trigger.set({name, conditions, config, type, active: 0, error: ''});
    } else {
        trigger = new Triggers({name, conditions, config, type, active: 0});
    }

    let result = await trigger.save();
    res.json({ result, trigger });
}

const all = async (req, res) => {
    let status = req.query.status || '';
    let triggers = await Triggers.list(status === 'active' ? 1 : '') || [];
    res.json({ result: true, triggers});
}

const duplicate = async (req, res) => {
    let id = req.params.id;
    let trigger = await Triggers.findById(id);
    let triggers = await Triggers.list('') || [];
    let baseName = trigger.name.split(' - duplicated').shift();
    let sameName = triggers.filter(item => item.name.indexOf(baseName) !== -1);
    trigger.set({name: baseName + ' - duplicated(' + (sameName.length) + ')', active: 0, id: ""});
    let result = await trigger.save();
    req.flash('triggers', { confirmation: { message: 'duplicated', result } });
    res.redirect('/triggers');
}

const remove = async (req, res) => {
    let id = req.params.id;
    let trigger = await Triggers.findById(id);
    if (!trigger) res.redirect('/triggers');

    let result = await trigger.remove();
    req.flash('triggers', { confirmation: { message: 'deleted', result } });
    res.redirect('/triggers');
}

const activate = async (req, res) => {
    let id = req.params.id;
    let trigger = await Triggers.findById(id);
    if (!trigger) res.redirect('/triggers');

    trigger.set({active: req.query.active});

    let result = await trigger.save();
    res.json({ result });
}

const conditionElement = async (req, res) => {
    let number = req.params.number;
    res.render('partials/condition', {
        number,
        condition: {}
    });
}

module.exports = { page, crudPage, crudTrigger, duplicate, remove, activate, all, conditionElement };