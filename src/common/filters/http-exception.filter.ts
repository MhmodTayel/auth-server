import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request ,Response } from 'express';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(AllExceptionsFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error(
      {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        error: exception instanceof Error ? exception.message : exception,
        stack: exception instanceof Error ? exception.stack : undefined,
      },
      'Exception caught',
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: typeof message === 'string' ? message : (message as any).message || message,
      ...(typeof message === 'object' && message !== null ? message : {}),
    });
  }
}