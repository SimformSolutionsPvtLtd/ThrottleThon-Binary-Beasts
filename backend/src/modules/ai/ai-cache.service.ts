import { Injectable } from '@nestjs/common';
import { AiCacheType } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CacheService } from '../../infrastructure/cache/cache.service';

@Injectable()
export class AiCacheService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async get(tenantId: string, cacheKey: string): Promise<{ data: unknown; createdAt: Date } | null> {
    const redisKey = this.rk(tenantId, cacheKey);

    const fromRedis = await this.cache.get<{ data: unknown; createdAt: string }>(redisKey);
    if (fromRedis) return { data: fromRedis.data, createdAt: new Date(fromRedis.createdAt) };

    const entry = await this.prisma.aiCache.findUnique({
      where: { tenantId_cacheKey: { tenantId, cacheKey } },
    });
    if (!entry || entry.expiresAt < new Date()) return null;

    await this.cache.set(redisKey, { data: entry.data, createdAt: entry.createdAt.toISOString() }, 3600);
    return { data: entry.data, createdAt: entry.createdAt };
  }

  async getByType(tenantId: string, cacheType: AiCacheType): Promise<{ data: unknown; createdAt: Date } | null> {
    const entry = await this.prisma.aiCache.findFirst({
      where: { tenantId, cacheType, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!entry) return null;
    return { data: entry.data, createdAt: entry.createdAt };
  }

  async set(tenantId: string, cacheKey: string, cacheType: AiCacheType, data: unknown, ttlHours = 24): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlHours * 3_600_000);
    const redisKey = this.rk(tenantId, cacheKey);

    await Promise.all([
      this.cache.set(redisKey, { data, createdAt: new Date().toISOString() }, ttlHours * 3600),
      this.prisma.aiCache.upsert({
        where: { tenantId_cacheKey: { tenantId, cacheKey } },
        update: { cacheType, data: data as never, expiresAt },
        create: { tenantId, cacheKey, cacheType, data: data as never, expiresAt },
      }),
    ]);
  }

  async invalidate(tenantId: string, cacheKey: string): Promise<void> {
    await Promise.all([
      this.cache.del(this.rk(tenantId, cacheKey)),
      this.prisma.aiCache.deleteMany({ where: { tenantId, cacheKey } }),
    ]);
  }

  async invalidateAll(tenantId: string): Promise<void> {
    const entries = await this.prisma.aiCache.findMany({ where: { tenantId }, select: { cacheKey: true } });
    await Promise.all([
      ...entries.map((e) => this.cache.del(this.rk(tenantId, e.cacheKey))),
      this.prisma.aiCache.deleteMany({ where: { tenantId } }),
    ]);
  }

  private rk(tenantId: string, cacheKey: string): string {
    return `ai:${tenantId}:${cacheKey}`;
  }
}
