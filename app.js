const ns = require('node-schedule');
const path = require('path');
const flash = require('connect-flash');
const dotenv = require('dotenv');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const db = require('./db/db');
const jobs = require('./modules/jobs');
const router = require('./routes/routes');
const passport = require('./config/passport');

dotenv.config({ path : '.env'});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SECRET
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use('/', router());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, './views'));

app.listen(process.env.PORT);

db.initializeScheduler();

ns.scheduleJob({
    second: 30
}, jobs.getContact);