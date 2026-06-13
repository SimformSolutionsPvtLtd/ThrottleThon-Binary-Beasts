import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly cs: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.validateUser(email, password);
    const tokens = await this.signTokens(user.id, user.email, user.role);
    await this.users.setRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async refresh(userId: string, rt: string): Promise<AuthTokens> {
    const user = await this.users.findById(userId);
    if (!user?.refreshToken) throw new UnauthorizedException('No refresh token');
    const ok = await bcrypt.compare(rt, user.refreshToken);
    if (!ok) throw new UnauthorizedException('Refresh mismatch');
    const tokens = await this.signTokens(user.id, user.email, user.role);
    await this.users.setRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.users.setRefreshToken(userId, null);
  }

  private async signTokens(sub: string, email: string, role: string): Promise<AuthTokens> {
    const payload: JwtPayload = { sub, email, role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.cs.get<string>('jwt.accessSecret'),
      expiresIn: this.cs.get<string>('jwt.accessTtl') ?? '15m',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.cs.get<string>('jwt.refreshSecret'),
      expiresIn: this.cs.get<string>('jwt.refreshTtl') ?? '7d',
    });
    return { accessToken, refreshToken };
  }
}
