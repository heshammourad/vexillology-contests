/**
 * Output logs to Node.js console
 */

const winston = require('winston');

const { LOG_LEVEL } = require('./env');

const { format } = winston;

const createLogger = (
  label,
  { handleExceptions = false, handleRejections = false } = {},
) => winston.loggers.add(label, {
  level: LOG_LEVEL,
  format: format.combine(format.label({ label }), format.json()),
  transports: [
    new winston.transports.Console({ handleExceptions, handleRejections }),
  ],
  exitOnError: false,
});

module.exports = { createLogger };
