import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role, User } from '@prisma/client';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async findById(id: string): Promise<User | null> {
    return this.repo.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findByEmail(email);
  }

  async findAll(): Promise<Omit<User, 'password' | 'refreshToken'>[]> {
    const users = await this.repo.findAll();
    return users.map(({ password: _p, refreshToken: _r, ...rest }) => rest);
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');
    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.repo.create({
      email: dto.email,
      password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: (dto.role ?? Role.USER) as Role,
    });
    const { password: _p, refreshToken: _r, ...safe } = user;
    return safe;
  }

  async setRefreshToken(userId: string, rt: string | null): Promise<void> {
    const hash = rt ? await bcrypt.hash(rt, 10) : null;
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.repo.update(userId, { refreshToken: hash, lastLoginAt: rt ? new Date() : undefined });
  }
}
