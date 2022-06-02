const Settings = require('../models/settings');

let settings = new Settings();

const page = async (req, res) => {
    let wbi = (await settings.get('wbi'))['value'];
    let auth = (await settings.get('auth'))['value'];

    res.render('settings', {
        title: 'WS Scheduler',
        wbi,
        auth,
        selected: 'settings'
    });
}

const save = async (req, res) => {
    let { wbi, auth } = req.body;

    await settings.modify('wbi', wbi);
    await settings.modify('auth', auth);

    wbi = (await settings.get('wbi'))['value'];
    auth = (await settings.get('auth'))['value'];
    res.render('settings', {
        title: 'WS Scheduler',
        wbi,
        auth,
        saved: true
    });
}

module.exports = { page, save };