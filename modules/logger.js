const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logger = winston.createLogger({
    level: winston.config.syslog.levels,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`+(info.splat!==undefined?`${info.splat}`:" "))
    ),
    transports: [
        new winston.transports.Console({
            level: 'info'
        }),
        new winston.transports.Console({
            level: 'error'
        }),
        new DailyRotateFile({
            name: 'info-file',
            level: 'info',
            filename: 'info-%DATE%.log',
            dirname: './logs',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        }),
        new DailyRotateFile({
            name: 'error-file',
            level: 'error',
            filename: './logs/error-%DATE%.log',
            dirname: './logs',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        })
    ]
});

function formatConsole(items) {
    return Array.from(items).map(item => {
        if (typeof item === 'object') {
            return JSON.stringify(item);
        } else if (!item && item !== 0 && item !== false) {
            return typeof item;
        } else if (!isNaN(Number(item))) {
            return item + '';
        }
        
        return item.toString()
    }).join(' ');
}

module.exports = {
    log: function() {
        logger.info(formatConsole(arguments));
    },
    info: function() {
        logger.info(formatConsole(arguments));
    },
    error: function() {
        logger.error(formatConsole(arguments));
    }
}