/**
 * Output logs to Node.js console
 */

const winston = require('winston');

const { format } = winston;

const { LOG_LEVEL = 'info' } = process.env;

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
