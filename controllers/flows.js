const WB = require('../modules/whatsapp');
const Flows = require('../models/flows');
const Settings = require('../models/settings');
const flowFiles = require('../modules/flows-files');

async function page(req, res) {
    let flows = await Flows.list('') || [];
    res.render('flows', {
        title: 'WS Scheduler',
        selected: 'flows',
        flows,
        messages: req.flash()
    });
}

async function crudPage(req, res) {
    let id = req.params.id;

    let title = 'Flow Builder';
    let flow = {};
    if (id !== undefined) {
        flow = await Flows.findById(id);
        title += ' - ' + flow.name;
        flow.set({detail: flow.detail});
    }

    res.render('crudFlow', {
        title,
        flow: JSON.stringify(flow),
        messages: req.flash("this is flows !!")
    });
}

async function crudFlow(req, res) {
    let id = req.params.id;
    let { name, trigger, detail, steps } = req.body;

    if (name === undefined || detail === undefined) {
        return res.json({ result: false });
    }

    let flow = {};
    if (id !== undefined) {
        flow = await Flows.findById(id);
        flow.set({name, detail, steps, trigger, status: 'idle', step: '', active: 0});
    } else {
        flow = new Flows({name, trigger, detail, steps, active: 0});
    }

    let result = await flow.save();
    await flowFiles.checkFlowsFiles();
    res.json({ result, flow });
}

async function duplicate(req, res) {
    let id = req.params.id;
    let flow = await Flows.findById(id);
    let flows = await Flows.list('') || [];
    let baseName = flow.name.split(' - duplicated').shift();
    let sameName = flows.filter(item => item.name.indexOf(baseName) !== -1);
    flow.set({
        name: baseName + ' - duplicated(' + (sameName.length) + ')',
        active: 0,
        status: 'idle',
        step: '',
        id: ""
    });
    let result = await flow.save();
    await flowFiles.checkFlowsFiles();
    req.flash('flows', { confirmation: { message: 'duplicated', result } });
    res.redirect('/flows');
}

async function remove(req, res) {
    let id = req.params.id;
    let flow = await Flows.findById(id);
    if (!flow) res.redirect('/flows');

    let result = await flow.remove();
    flowFiles.deleteFlowFiles(flow.id);
    req.flash('flows', { confirmation: { message: 'deleted', result }});
    res.redirect('/flows');
}

async function activate(req, res) {
    let id = req.params.id;
    let flow = await Flows.findById(id);
    if (!flow) res.redirect('/flows');

    flow.set({ active: req.query.active, status: 'idle', step: ''});

    let result = await flow.save();
    res.json({ result });
}

async function uploadFLowFiles(req, res) {
    let id = req.params.id;
    let verify = req.query.verify;

    if (verify === 'yes') {
        let fileName = req.query.name;
        let result = flowFiles.verifyDuplicated(id, fileName);
        return res.json({ result });
    }
    
    let flow = await Flows.findById(id);
    if (flow.id != id) {
        return res.json({ result: false });
    }
    
    if(!req.files) {
        return res.json({ result: false });
    }

    let file = req.files.file;
    let result = await flowFiles.uploadFile(id, file);
    return res.json({ result: result === undefined });
}

async function getWBMsgTemplates(req, res) {
    let settings = new Settings();
    let wbi = await settings.get('wbi');
    let pni = await settings.get('pni');
    let auth = await settings.get('auth');

    let wb = new WB({ 
        authToken: auth.value, 
        phoneNumberID: pni.value, 
        whatsappBusinessID: wbi.value
    });

    let response = await wb.getMessageTemplates();

    if (response.data) {
        let templates = [];
        for (let template of response.data) {
            if (template.status !== 'APPROVED') continue;

            templateInfo = {
                code: template.name,
                id: template.id,
                language: template.language,
                name: template.name.split('_').map(item => item.toUpperCase()).join(' '),
                category: template.category,
                components: {},
                inputs: 0
            }

            for (let component of template.components) {
                let value = undefined;
                if (component.type === 'BUTTONS') {
                    value = component.buttons;
                } else if (component.format === 'TEXT' || component.format === undefined) {
                    value = component.text;
                } else if (component.format !== '') {
                    value = '';
                }

                templateInfo.components[component.type.toLowerCase()] = {
                    format: component.format ?? 'TEXT',
                    template: value,
                    value: []
                };
                
                if (typeof value === 'string') {
                    templateInfo.inputs += value.split('{{').length - 1;
                } else if (component.type === 'BUTTONS') {
                    for (let button of component.buttons) {
                        templateInfo.inputs += button.text.split('{{').length - 1;
                    }
                }
            }

            templates.push(templateInfo);
        }
        return res.json({ 
            result: response.data !== undefined, 
            data: {
                templates,
                detail: response.data
            }
        });
    } else {
        return res.json({ result: false });
    }
}

module.exports = { page, crudPage, duplicate, remove, activate, crudFlow, uploadFLowFiles, getWBMsgTemplates };