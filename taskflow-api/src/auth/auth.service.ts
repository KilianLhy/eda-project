import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../shared/infrastructure/prisma.service';
import { compareSync, hashSync } from 'bcryptjs';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    const user = await this.prisma.user.create({
      data: {
        id: randomUUID(),
        email: normalizedEmail,
        passwordHash: hashSync(password, 10),
        notificationPreference: {
          create: {
            emailEnabled: true,
            inAppEnabled: true,
          },
        },
      },
    });

    return this.createToken(user.id, user.email);
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !compareSync(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createToken(user.id, user.email);
  }

  private createToken(userId: string, email: string) {
    const accessToken = this.jwtService.sign({ sub: userId, email });
    return {
      accessToken,
      user: {
        id: userId,
        email,
      },
    };
  }
}
