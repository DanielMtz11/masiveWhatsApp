const Triggers = require('../models/triggers');

const page = async (req, res) => {
    let triggers = await Triggers.list('') || [];
    res.render('triggers', {
        title: 'WS Scheduler',
        selected: 'triggers',
        triggers,
        messages: req.flash()
    });
}

const newPage = async (req, res) => {
    res.render('newTrigger', {
        title: 'Trigger Builder',
        messages: req.flash()
    });
}

const duplicate = async (req, res) => {
    let id = req.params.id;
    let trigger = await Triggers.findById(id);
    let triggers = await Triggers.list('') || [];
    let baseName = trigger.name.split(' - duplicated').shift();
    let sameName = triggers.filter(item => item.name.indexOf(baseName) !== -1);
    trigger.name = baseName + ' - duplicated(' + (sameName.length) + ')';
    trigger.active = 0;
    trigger.id = "";
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

    trigger.active = req.query.active;

    let result = await trigger.save();
    res.json({ result });
}

module.exports = { page, newPage, duplicate, remove, activate };