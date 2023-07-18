/**
 * Output logs to Node.js console
 */

const winston = require('winston');
const { LOG_LEVEL } = require('./env');

const { format } = winston;

const createLogger = (customLabel) => winston.createLogger({
  level: LOG_LEVEL,
  format: format.combine(
    format.label({ label: customLabel }),
    format.json(),
  ),
  transports: [
    new winston.transports.Console({ handleExceptions: true, handleRejections: true }),
  ],
  exitOnError: false,
});

module.exports = { createLogger };
