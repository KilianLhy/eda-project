import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../shared/infrastructure/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import { hashSync } from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      notificationPreference: {
        findUnique: jest.fn(),
      },
    };

    const mockJwtService = {
      sign: jest.fn(() => 'token-mock'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('register', () => {
    it('should register a new user and return token', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
        passwordHash: 'hashed',
      });

      const result = await service.register(email, password);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user.id', 'user-1');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      });

      await expect(
        service.register('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const passwordHash = hashSync(password, 10);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
        passwordHash,
      });

      const result = await service.login(email, password);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user.id', 'user-1');
    });

    it('should throw for invalid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for wrong password', async () => {
      const email = 'test@example.com';
      const passwordHash = hashSync('correct-password', 10);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
        passwordHash,
      });

      await expect(service.login(email, 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
