const express = require('express');
const auth = require('../controllers/auth');
const settings = require('../controllers/settings');
const flows = require('../controllers/flows');
const triggers = require('../controllers/triggers');

const router = express.Router();

module.exports = () => {
    router.get('/', auth.isAuthenticated, settings.page);

    router.get('/login', auth.loginPage);
    router.post('/login', auth.login);
    
    router.get('/logout', auth.logout);

    router.post('/settings/save', auth.isAuthenticated, settings.save);

    router.get('/flows', auth.isAuthenticated, flows.page);
    router.get('/flows/new', auth.isAuthenticated, flows.newPage);
    router.get('/flows/duplicate/:id', auth.isAuthenticated, flows.duplicate);
    router.get('/flows/delete/:id', auth.isAuthenticated, flows.remove);
    router.get('/flows/activate/:id', auth.isAuthenticated, flows.activate);

    router.get('/triggers', auth.isAuthenticated, triggers.page);
    router.get('/triggers/new', auth.isAuthenticated, triggers.newPage);
    router.get('/triggers/duplicate/:id', auth.isAuthenticated, triggers.duplicate);
    router.get('/triggers/delete/:id', auth.isAuthenticated, triggers.remove);
    router.get('/triggers/activate/:id', auth.isAuthenticated, triggers.activate);

    return router;
};