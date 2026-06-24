// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException({ code: 'USER_ALREADY_EXISTS', message: 'Email already registered' });

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password: hashed },
    });
    const tokens = await this.generateTokens(user.id);
    return { user: { id: user.id, name: user.name, email: user.email }, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    const tokens = await this.generateTokens(user.id);
    return { user: { id: user.id, name: user.name, email: user.email }, ...tokens };
  }

  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN', message: 'Invalid refresh token' });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { refreshTokens: true },
    });
    if (!user) throw new UnauthorizedException({ code: 'INVALID_TOKEN', message: 'User not found' });

    // Find matching token
    let matchedToken: { id: string; tokenHash: string; userId: string; expiresAt: Date; createdAt: Date } | null = null;
    for (const token of user.refreshTokens) {
      if (await bcrypt.compare(refreshToken, token.tokenHash)) {
        matchedToken = token;
        break;
      }
    }
    if (!matchedToken || matchedToken.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: 'TOKEN_EXPIRED', message: 'Refresh token expired' });
    }

    await this.prisma.refreshToken.delete({ where: { id: matchedToken.id } });
    return this.generateTokens(user.id);
  }

  async logout(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      // Invalid token – treat as already logged out
      return { data: null };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { refreshTokens: true },
    });
    if (!user) return { data: null };

    for (const token of user.refreshTokens) {
      if (await bcrypt.compare(refreshToken, token.tokenHash)) {
        await this.prisma.refreshToken.delete({ where: { id: token.id } });
        break;
      }
    }
    return { data: null };
  }

  private async generateTokens(userId: string) {
    const accessToken = this.jwtService.sign({ sub: userId });
    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('REFRESH_TOKEN_EXPIRY'),
      },
    );

    const expiresAt = new Date();
    const expirySeconds = this.config.get('REFRESH_TOKEN_EXPIRY');
    const ms = expirySeconds.endsWith('d')
      ? parseInt(expirySeconds) * 24 * 60 * 60 * 1000
      : parseInt(expirySeconds) * 1000;
    expiresAt.setTime(expiresAt.getTime() + ms);

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.refreshToken.create({
      data: { tokenHash, userId, expiresAt },
    });
    return { accessToken, refreshToken };
  }
}