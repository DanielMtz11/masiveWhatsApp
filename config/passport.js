// import Users from '../models/Users';
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

passport.use(
    new LocalStrategy({
        usernameField: 'user',
        passwordField: 'pass'
    },
    async (user, pass, done) => {
        if (process.env.PASS !== pass || process.env.USER !== user) {
            return done(null, false, {
                message: 'User not found'
            });
        }

        done(null, 'Done!');
    })
);

passport.serializeUser((usuario, callback) => {
    callback(null, usuario);
});

passport.deserializeUser((usuario, callback) => {
    callback(null, usuario);
});

module.exports = passport;