import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue({
      secret: 'test-secret',
      expiresIn: '1d',
    }),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate and return user payload', async () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual({
        id: mockUser._id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const payload = {
        sub: 'nonexistent-id',
        email: 'test@example.com',
      };

      mockUsersService.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when findOne throws error', async () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
      };

      mockUsersService.findOne.mockRejectedValue(
        new UnauthorizedException('User not found'),
      );

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

