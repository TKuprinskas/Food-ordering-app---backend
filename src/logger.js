const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  defaultMeta: { service: 'tennis' },
  transports: [
    new transports.Console({ level: 'info' }),
    new transports.File({ filename: 'logs-errors.log', level: 'error' }),
    new transports.File({ filename: 'logs-all.log' }),
  ],
});

module.exports = logger;
