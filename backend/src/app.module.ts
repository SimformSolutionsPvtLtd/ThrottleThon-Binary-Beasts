import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { validateEnv } from './config/env.validation';

import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { QueueModule } from './infrastructure/queue/queue.module';

import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { StatusModule } from './modules/status/status.module';
import { ScenariosModule } from './modules/scenarios/scenarios.module';
import { DevelopersModule } from './modules/developers/developers.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { GitReposModule } from './modules/git-repos/git-repos.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { ForecastModule } from './modules/forecast/forecast.module';
import { AllocationsModule } from './modules/allocations/allocations.module';
import { AiModule } from './modules/ai/ai.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { DebateModule } from './modules/debate/debate.module';
import { IdentityMapModule } from './modules/identity-map/identity-map.module';
import { BriefModule } from './modules/brief/brief.module';

import { HealthController } from './common/health/health.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 60 }]),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          ...parseRedisUrl(process.env.REDIS_URL ?? 'redis://localhost:6379'),
        },
      }),
    }),
    PrismaModule,
    CacheModule,
    QueueModule,
    CommonModule,
    AuthModule,
    TenantModule,
    StatusModule,
    ScenariosModule,
    DevelopersModule,
    TicketsModule,
    GitReposModule,
    AuditLogsModule,
    ForecastModule,
    AllocationsModule,
    AiModule,
    IngestionModule,
    DebateModule,
    IdentityMapModule,
    BriefModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

function parseRedisUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    password: u.password || undefined,
  };
}
