import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';
import { Public } from '../decorators/public.decorator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { REDIS_CLIENT } from '../../infrastructure/cache/cache.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly version: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    try {
      const pkgPath = path.resolve(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { version?: string };
      this.version = pkg.version ?? '0.0.0';
    } catch {
      this.version = '0.0.0';
    }
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness and readiness probe', description: 'Returns status of database, redis, and AI availability. Always returns 200.' })
  @ApiResponse({ status: 200, description: 'Health status object' })
  async check() {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const ai = this.config.get<string>('GEMINI_API_KEY') ? 'available' : 'fixture_mode';

    return {
      status: 'ok',
      uptime: process.uptime(),
      version: this.version,
      timestamp: new Date().toISOString(),
      database,
      redis,
      ai,
    };
  }

  private async checkDatabase(): Promise<'connected' | 'disconnected'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }

  private async checkRedis(): Promise<'connected' | 'disconnected'> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG' ? 'connected' : 'disconnected';
    } catch {
      return 'disconnected';
    }
  }
}
