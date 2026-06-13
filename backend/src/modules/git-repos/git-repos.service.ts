import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class GitReposService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.gitRepository.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        defaultBranch: true,
        language: true,
        framework: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const repo = await this.prisma.gitRepository.findFirst({
      where: { id, tenantId },
    });
    if (!repo) throw new NotFoundException('Git repository not found');
    return repo;
  }
}
