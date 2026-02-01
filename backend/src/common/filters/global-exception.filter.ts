import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status: number;
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.constructor.name;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || 'An error occurred';
        error = (exceptionResponse as any).error || exception.constructor.name;
      } else {
        message = 'An error occurred';
        error = exception.constructor.name;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Internal Server Error';

      // Log the actual error for debugging in development
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
        'GlobalExceptionFilter'
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Internal Server Error';

      this.logger.error(
        `Unknown error: ${JSON.stringify(exception)}`,
        'GlobalExceptionFilter'
      );
    }

    // In production, sanitize error responses to avoid leaking internal details
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      // Don't expose internal error details in production
      message = 'Internal server error';
      error = 'Internal Server Error';
    }

    const errorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Only include stack trace in development for internal server errors
    if (!isProduction && exception instanceof Error && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      (errorResponse as any).stack = exception.stack;
    }

    // Log error details for monitoring
    this.logger.error(
      `HTTP ${status} Error at ${request.method} ${request.url}: ${message}`,
      isProduction ? '' : (exception as Error)?.stack,
      'GlobalExceptionFilter'
    );

    response.status(status).json(errorResponse);
  }
}