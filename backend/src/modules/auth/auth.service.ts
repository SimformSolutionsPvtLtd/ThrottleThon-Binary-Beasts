import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PermissionAction } from '../../common/constants/permissions';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    tenantId: string;
    tenantSlug: string;
    roleName: string;
    permissions: PermissionAction[];
  };
  tenantBranding: {
    brandName: string;
    primaryColor: string;
    logoUrl: string | null;
  };
}

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  tenantSlug: string;
  roleName: string;
  permissions: PermissionAction[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly cs: ConfigService,
  ) {}

  async login(email: string, password: string, tenantSlug: string): Promise<LoginResult> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant || !tenant.isActive) throw new UnauthorizedException('Invalid credentials');

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const membership = await this.prisma.tenantMembership.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    if (!membership || !membership.isActive) {
      throw new ForbiddenException('User has no active membership in this tenant');
    }

    const permissions = membership.role.permissions.map(
      (rp) => rp.permission.action as PermissionAction,
    );

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      roleName: membership.role.name,
      permissions,
    };

    const { accessToken, refreshToken } = await this.issueTokens(payload);
    await this.persistRefreshToken(user.id, tenant.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        roleName: membership.role.name,
        permissions,
      },
      tenantBranding: {
        brandName: tenant.brandName,
        primaryColor: tenant.primaryColor,
        logoUrl: tenant.logoUrl,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: JwtPayload;
    try {
      decoded = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.cs.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        userId: decoded.sub,
        tenantId: decoded.tenantId,
        tokenHash,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });
    if (!stored) throw new UnauthorizedException('Refresh token expired or revoked');

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true },
    });

    const membership = await this.prisma.tenantMembership.findUnique({
      where: { userId_tenantId: { userId: decoded.sub, tenantId: decoded.tenantId } },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        tenant: true,
      },
    });
    if (!membership || !membership.isActive) {
      throw new UnauthorizedException('Membership no longer active');
    }

    const permissions = membership.role.permissions.map(
      (rp) => rp.permission.action as PermissionAction,
    );
    const payload: JwtPayload = {
      sub: decoded.sub,
      email: decoded.email,
      tenantId: membership.tenantId,
      tenantSlug: membership.tenant.slug,
      roleName: membership.role.name,
      permissions,
    };
    const tokens = await this.issueTokens(payload);
    await this.persistRefreshToken(decoded.sub, membership.tenantId, tokens.refreshToken);
    return tokens;
  }

  async getProfile(userId: string, tenantId: string) {
    const membership = await this.prisma.tenantMembership.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
      include: {
        user: true,
        tenant: true,
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });
    if (!membership) throw new UnauthorizedException('Membership not found');

    return {
      id: membership.user.id,
      email: membership.user.email,
      firstName: membership.user.firstName,
      lastName: membership.user.lastName,
      tenant: {
        id: membership.tenant.id,
        slug: membership.tenant.slug,
        name: membership.tenant.name,
        brandName: membership.tenant.brandName,
        primaryColor: membership.tenant.primaryColor,
        logoUrl: membership.tenant.logoUrl,
        plan: membership.tenant.plan,
      },
      roleName: membership.role.name,
      permissions: membership.role.permissions.map((rp) => rp.permission.action),
    };
  }

  async getUserTenants(userId: string) {
    const memberships = await this.prisma.tenantMembership.findMany({
      where: { userId, isActive: true, tenant: { isActive: true } },
      include: { tenant: true, role: true },
    });
    return memberships.map((m) => ({
      tenantId: m.tenant.id,
      tenantSlug: m.tenant.slug,
      tenantName: m.tenant.name,
      brandName: m.tenant.brandName,
      primaryColor: m.tenant.primaryColor,
      roleName: m.role.name,
    }));
  }

  private async issueTokens(payload: JwtPayload) {
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.cs.get<string>('JWT_SECRET'),
      expiresIn: this.cs.get<string>('JWT_ACCESS_EXPIRY') ?? '15m',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.cs.get<string>('JWT_SECRET'),
      expiresIn: this.cs.get<string>('JWT_REFRESH_EXPIRY') ?? '7d',
    });
    return { accessToken, refreshToken };
  }

  private async persistRefreshToken(
    userId: string,
    tenantId: string,
    refreshToken: string,
  ): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + this.refreshTtlMs());
    await this.prisma.refreshToken.create({
      data: { userId, tenantId, tokenHash, expiresAt },
    });
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private refreshTtlMs(): number {
    const raw = this.cs.get<string>('JWT_REFRESH_EXPIRY') ?? '7d';
    const match = raw.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const n = Number(match[1]);
    const unit = match[2];
    const mult = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 86_400_000;
    return n * mult;
  }
}
