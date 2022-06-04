const winston = require('winston');

const { format } = winston;

const { LOG_LEVEL = 'info' } = process.env;

const createLogger = (customLabel) => winston.createLogger({
  level: LOG_LEVEL,
  format: format.combine(
    format.label({ label: customLabel }),
    format.timestamp(),
    format.printf(({
      label, level, message, timestamp,
    }) => `${timestamp} [${label}] ${level}: ${message}`),
    format.json(),
  ),
  transports: [
    new winston.transports.Console({ handleExceptions: true, handleRejections: true }),
  ],
  exitOnError: false,
});

module.exports = { createLogger };
