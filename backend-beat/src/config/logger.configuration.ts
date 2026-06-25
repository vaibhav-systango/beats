import { ConfigService, registerAs } from '@nestjs/config';
import { Params } from 'nestjs-pino';
import { ulid } from 'ulid';

export const loggerConfiguration = registerAs('logger', (): Params => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development' || env === 'local';

    return {
        pinoHttp: {
            level: process.env.LOG_LEVEL || 'info',
            genReqId: (request) =>
                request.headers['x-correlation-id'] || ulid(),
            autoLogging: false,
            redact: {
                paths: [
                    'req.body.password',
                    'req.body.token',
                    'req.body.secret',
                    'req.headers.authorization',
                    'req.headers.cookie',
                ],
                censor: '***',
            },
            serializers: {
                req(req) {
                    req.body = req.raw.body;
                    return req;
                },
                err: (err) => ({
                    type: err.name,
                    message: err.message,
                    stack: err.stack?.replace(/\n/g, '\\n')?.replace(/\s+/g, ' '),
                }),
            },
            formatters: {
                level: (label) => ({ level: label.toUpperCase() }),
            },
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    levelFirst: true,
                    translateTime: 'SYS:standard',
                    singleLine: true,
                    ignore: 'pid,hostname,req.headers,context,req,method,url,correlationId',
                    messageFormat: isDevelopment
                        ? '\x1b[35m[{context}]\x1b[0m \x1b[32m{msg}\x1b[0m \x1b[34m[CorrelationId:{req.id}]\x1b[0m'
                        : '[{context}] {msg} [CorrelationId:{req.id}]',
                },
            },
        },
        renameContext: 'context',
    };
});
