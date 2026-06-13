import { Injectable, NotFoundException } from '@nestjs/common';
import { Project } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Project[]> {
    return this.prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string): Promise<Project> {
    const p = await this.prisma.project.findUnique({
      where: { id },
      include: { repositories: true, sprints: true, scenarios: true },
    });
    if (!p) throw new NotFoundException(`Project ${id} not found`);
    return p;
  }

  create(dto: CreateProjectDto): Promise<Project> {
    return this.prisma.project.create({
      data: { name: dto.name, description: dto.description },
    });
  }
}
