import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { SigninDto } from './dto/signin.dto';
import * as bcrypt from 'bcrypt';


jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    create: jest.fn(),
    findOneByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: 'PinoLogger:AuthService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user and return access token', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!',
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockToken = 'mock.jwt.token';

      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await authService.signup(createUserDto);

      expect(result).toEqual({
        message: 'User registered successfully',
        access_token: mockToken,
        user: {
          id: mockUser._id,
          email: mockUser.email,
          name: mockUser.name,
        },
      });
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        name: 'Test User',
        password: 'Password123!',
      };

      mockUsersService.create.mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(authService.signup(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('signin', () => {
    it('should sign in user with valid credentials', async () => {
      const signinDto: SigninDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword',
      };

      const mockToken = 'mock.jwt.token';

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await authService.signin(signinDto);

      expect(result).toEqual({
        message: 'Signin successful',
        access_token: mockToken,
        user: {
          id: mockUser._id,
          email: mockUser.email,
          name: mockUser.name,
        },
      });
      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        signinDto.email,
        { includePassword: true },
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        signinDto.password,
        mockUser.password,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const signinDto: SigninDto = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(null);

      await expect(authService.signin(signinDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const signinDto: SigninDto = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.signin(signinDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});