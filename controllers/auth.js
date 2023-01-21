const passport = require('passport');

const loginPage = (req, res) => {
    res.render('login', {
        title: 'Ws-Scheduler '
    });
}

const login = passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    badRequestMessage: 'Username and password cannot be empty' 
});

const logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login'); // al cerrar sesión nos lleva al login
    })
};

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        console.log(req.body)
        return next();
    }

    return res.redirect('/login');
}

module.exports = { loginPage, login, isAuthenticated, logout };