const winston = require('winston')
const fs = require('fs')
const path = require('path')
const logsDir = 'logs'

if(!fs.existsSync(logsDir)){
    fs.mkdirSync(logsDir)
}

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, '/webapp.log')
        })
    ]
})

module.exports = logger;