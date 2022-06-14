const ns = require('node-schedule');
const path = require('path');
const flash = require('connect-flash');
const dotenv = require('dotenv');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

const db = require('./db/db');
const WB = require('./modules/whatsapp');
const jobs = require('./modules/jobs');
const router = require('./routes/routes');
const passport = require('./config/passport');
const flowFiles = require('./modules/flows-files');

flowFiles.checkFlowsFiles();

dotenv.config({ path : '.env'});

const app = express();

app.use(session({
    secret: process.env.SECRET
}));
app.use(fileUpload({
    createParentPath: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use('/', router());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, './views'));

app.listen(process.env.PORT);

db.initializeScheduler();

ns.scheduleJob({
    second: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
}, jobs.flowExecuter);