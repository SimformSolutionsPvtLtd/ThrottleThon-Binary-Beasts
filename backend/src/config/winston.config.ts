import * as winston from 'winston';
import { utilities as nestWinstonUtilities } from 'nest-winston';

export const winstonConfig: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize({ all: true }),
          nestWinstonUtilities.format.nestLike('SmarterSprint', {
            prettyPrint: true,
            colors: true,
          }),
        ),
  ),
  transports: [new winston.transports.Console()],
};
