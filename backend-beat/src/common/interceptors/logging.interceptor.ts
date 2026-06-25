import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const className = context.getClass().name;
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url } = request;
    const now = Date.now();
    this.logger.assign({ context: className });
    this.logger.info(`${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        const delay = Date.now() - now;
        this.logger.info(
          { res: { statusCode: response.statusCode }, responseTime: delay },
          'request completed',
        );
      }),
    );
  }
}
