import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AddMemberDto, ChangeRoleDto } from './dto/member.dto';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async getBrandingBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { slug: true, brandName: true, primaryColor: true, logoUrl: true, isActive: true },
    });
    if (!tenant || !tenant.isActive) throw new NotFoundException('Tenant not found');
    const { isActive: _ignored, ...branding } = tenant;
    return branding;
  }

  async getCurrent(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async updateCurrent(tenantId: string, dto: UpdateTenantDto) {
    const data: Prisma.TenantUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.brandName !== undefined && { brandName: dto.brandName }),
      ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      ...(dto.primaryColor !== undefined && { primaryColor: dto.primaryColor }),
      ...(dto.settings !== undefined && { settings: dto.settings as Prisma.InputJsonValue }),
    };
    return this.prisma.tenant.update({ where: { id: tenantId }, data });
  }

  async listMembers(tenantId: string) {
    const memberships = await this.prisma.tenantMembership.findMany({
      where: { tenantId },
      include: { user: true, role: true },
      orderBy: { joinedAt: 'asc' },
    });
    return memberships.map((m) => ({
      userId: m.user.id,
      email: m.user.email,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      isActive: m.isActive && m.user.isActive,
      joinedAt: m.joinedAt,
      role: { id: m.role.id, name: m.role.name, description: m.role.description },
    }));
  }

  async addMember(tenantId: string, dto: AddMemberDto) {
    const role = await this.prisma.role.findUnique({
      where: { tenantId_name: { tenantId, name: dto.roleName } },
    });
    if (!role) throw new BadRequestException(`Role "${dto.roleName}" not found in tenant`);

    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      if (!dto.password) {
        throw new BadRequestException('Password required when creating a new user');
      }
      const passwordHash = await bcrypt.hash(dto.password, 12);
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });
    }

    const existing = await this.prisma.tenantMembership.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId } },
    });
    if (existing) throw new ConflictException('User is already a member of this tenant');

    return this.prisma.tenantMembership.create({
      data: { userId: user.id, tenantId, roleId: role.id },
      include: { user: true, role: true },
    });
  }

  async changeRole(tenantId: string, userId: string, dto: ChangeRoleDto) {
    const role = await this.prisma.role.findUnique({
      where: { tenantId_name: { tenantId, name: dto.roleName } },
    });
    if (!role) throw new BadRequestException(`Role "${dto.roleName}" not found in tenant`);

    return this.prisma.tenantMembership.update({
      where: { userId_tenantId: { userId, tenantId } },
      data: { roleId: role.id },
      include: { role: true },
    });
  }

  async deactivateMember(tenantId: string, userId: string) {
    await this.prisma.tenantMembership.update({
      where: { userId_tenantId: { userId, tenantId } },
      data: { isActive: false },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId, tenantId, isRevoked: false },
      data: { isRevoked: true },
    });
    return { success: true };
  }
}
