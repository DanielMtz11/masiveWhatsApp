const Settings = require('../models/settings');


const page = async (req, res) => {
    let settings = new Settings();
    let wbi = (await settings.get('wbi'))['value'];
    let pni = (await settings.get('pni'))['value'];
    let auth = (await settings.get('auth'))['value'];

    res.render('settings', {
        title: 'WS Scheduler',
        wbi,
        pni,
        auth,
        selected: 'settings'
    });
}

const save = async (req, res) => {
    let { wbi, pni, auth } = req.body;

    let settings = new Settings();
    await settings.modify('wbi', wbi);
    await settings.modify('pni', pni);
    await settings.modify('auth', auth);

    wbi = (await settings.get('wbi'))['value'];
    pni = (await settings.get('pni'))['value'];
    auth = (await settings.get('auth'))['value'];
    res.render('settings', {
        title: 'WS Scheduler',
        wbi,
        pni,
        auth,
        saved: true
    });
}

module.exports = { page, save };