import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

interface ErrorEnvelope {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  details?: unknown;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const env = this.toEnvelope(exception, req.url);
    if (env.statusCode >= 500) {
      this.logger.error(
        `[${req.method}] ${req.url} → ${env.statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`[${req.method}] ${req.url} → ${env.statusCode} ${env.message}`);
    }

    res.status(env.statusCode).json(env);
  }

  private toEnvelope(ex: unknown, path: string): ErrorEnvelope {
    const timestamp = new Date().toISOString();

    if (ex instanceof HttpException) {
      const body = ex.getResponse();
      const message = typeof body === 'string' ? body : (body as { message?: string | string[] }).message ?? ex.message;
      return {
        statusCode: ex.getStatus(),
        message: Array.isArray(message) ? message.join('; ') : message,
        error: HttpStatus[ex.getStatus()] ?? 'Http Exception',
        timestamp,
        path,
      };
    }

    if (ex instanceof ZodError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        error: 'Bad Request',
        timestamp,
        path,
        details: ex.flatten(),
      };
    }

    if (ex instanceof Prisma.PrismaClientKnownRequestError) {
      const status =
        ex.code === 'P2002'
          ? HttpStatus.CONFLICT
          : ex.code === 'P2025'
            ? HttpStatus.NOT_FOUND
            : HttpStatus.BAD_REQUEST;
      return {
        statusCode: status,
        message: ex.code === 'P2002' ? 'Unique constraint violation' : ex.message.split('\n').slice(-1)[0],
        error: 'Database Error',
        timestamp,
        path,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
      timestamp,
      path,
    };
  }
}
