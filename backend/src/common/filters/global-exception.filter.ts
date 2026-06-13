import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
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

    // 429 throttle — must come before generic HttpException check
    if (ex instanceof ThrottlerException) {
      return {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests. Please wait a moment.',
        error: 'Too Many Requests',
        timestamp,
        path,
      };
    }

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
      const fieldErrors = ex.flatten().fieldErrors;
      const messages = Object.entries(fieldErrors)
        .map(([field, errs]) => `${field}: ${(errs ?? []).join(', ')}`)
        .join('; ');
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: messages || 'Validation failed',
        error: 'Bad Request',
        timestamp,
        path,
        details: fieldErrors,
      };
    }

    if (ex instanceof Prisma.PrismaClientKnownRequestError) {
      if (ex.code === 'P2002') {
        return { statusCode: HttpStatus.CONFLICT, message: 'This record already exists', error: 'Conflict', timestamp, path };
      }
      if (ex.code === 'P2025') {
        return { statusCode: HttpStatus.NOT_FOUND, message: 'Record not found', error: 'Not Found', timestamp, path };
      }
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'Database request error', error: 'Bad Request', timestamp, path };
    }

    if (ex instanceof Prisma.PrismaClientValidationError) {
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'Invalid data provided', error: 'Bad Request', timestamp, path };
    }

    // Gemini / Google AI SDK errors
    if (this.isGeminiError(ex)) {
      return { statusCode: HttpStatus.SERVICE_UNAVAILABLE, message: 'AI service temporarily unavailable', error: 'Service Unavailable', timestamp, path };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong. Please try again.',
      error: 'Internal Server Error',
      timestamp,
      path,
    };
  }

  private isGeminiError(ex: unknown): boolean {
    if (!(ex instanceof Error)) return false;
    const name = ex.constructor?.name ?? '';
    const msg = ex.message ?? '';
    return (
      name.includes('GoogleGenerativeAI') ||
      msg.includes('GoogleGenerativeAI') ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('DEADLINE_EXCEEDED') ||
      (ex as { status?: number }).status === 429 ||
      (ex as { status?: number }).status === 503
    );
  }
}
