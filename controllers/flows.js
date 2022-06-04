const Flows = require('../models/flows');

const page = async (req, res) => {
    let flows = await Flows.list('') || [];
    res.render('flows', {
        title: 'WS Scheduler',
        selected: 'flows',
        flows,
        messages: req.flash()
    });
}

const crudPage = async (req, res) => {
    let id = req.params.id;

    let title = 'Flow Builder';
    let flow = {};
    if (id !== undefined) {
        flow = await Flows.findById(id);
        title += ' - ' + flow.name;
        flow.detail = JSON.parse(flow.detail);
    }

    res.render('crudFlow', {
        title,
        flow: JSON.stringify(flow),
        messages: req.flash()
    });
}

const crudFlow = async (req, res) => {
    let id = req.params.id;
    let { name, detail } = req.body;

    if (name === undefined || detail === undefined) {
        return res.json({ result: false });
    }

    let flow = {};
    if (id !== undefined) {
        flow = await Flows.findById(id);
        flow.name = name;
        flow.detail = detail;
    } else {
        flow = new Flows(name, detail);
    }

    let result = await flow.save();
    res.json({ result, flow });
}
const duplicate = async (req, res) => {
    let id = req.params.id;
    let flow = await Flows.findById(id);
    let flows = await Flows.list('') || [];
    let baseName = flow.name.split(' - duplicated').shift();
    let sameName = flows.filter(item => item.name.indexOf(baseName) !== -1);
    flow.name = baseName + ' - duplicated(' + (sameName.length) + ')';
    flow.active = 0;
    flow.id = "";
    let result = await flow.save();
    req.flash('flows', { confirmation: { message: 'duplicated', result } });
    res.redirect('/flows');
}

const remove = async (req, res) => {
    let id = req.params.id;
    let flow = await Flows.findById(id);
    if (!flow) res.redirect('/flows');

    let result = await flow.remove();
    req.flash('flows', { confirmation: { message: 'deleted', result } });
    res.redirect('/flows');
}

const activate = async (req, res) => {
    let id = req.params.id;
    let flow = await Flows.findById(id);
    if (!flow) res.redirect('/flows');

    flow.active = req.query.active;

    let result = await flow.save();
    res.json({ result });
}

module.exports = { page, crudPage, duplicate, remove, activate, crudFlow };