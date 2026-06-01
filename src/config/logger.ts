import { WinstonModuleOptions } from 'nest-winston';
import { format, transports } from 'winston';

const { combine, timestamp, printf, errors } = format;

const logFormat = printf(({ timestamp, level, message, stack, ...meta }) => {
  const base = `${timestamp} [${level}] ${stack ?? message}`;
  const metaText = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${base}${metaText}`;
});

export const loggerConfig: WinstonModuleOptions = {
  transports: [
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 1000000,
      format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat,
      ),
    }),

    new transports.File({
      filename: 'logs/app.log',
      maxsize: 1000000,
      format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat,
      ),
    }),

    new transports.File({
      filename: 'logs/security.log',
      level: 'security',
      maxsize: 1000000,
      format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat,
      ),
    }),
  ],
};
