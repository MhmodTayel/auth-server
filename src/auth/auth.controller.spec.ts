import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { SigninDto } from './dto/signin.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signup: jest.fn(),
    signin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should call authService.signup and return result', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!',
      };

      const mockResult = {
        message: 'User registered successfully',
        access_token: 'mock.jwt.token',
        user: {
          id: '507f1f77bcf86cd799439011',
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      mockAuthService.signup.mockResolvedValue(mockResult);

      const result = await controller.signup(createUserDto);

      expect(result).toEqual(mockResult);
      expect(authService.signup).toHaveBeenCalledWith(createUserDto);
      expect(authService.signup).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from authService', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!',
      };

      const error = new Error('Email already exists');
      mockAuthService.signup.mockRejectedValue(error);

      await expect(controller.signup(createUserDto)).rejects.toThrow(error);
      expect(authService.signup).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('signin', () => {
    it('should call authService.signin and return result', async () => {
      const signinDto: SigninDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockResult = {
        message: 'Signin successful',
        access_token: 'mock.jwt.token',
        user: {
          id: '507f1f77bcf86cd799439011',
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      mockAuthService.signin.mockResolvedValue(mockResult);

      const result = await controller.signin(signinDto);

      expect(result).toEqual(mockResult);
      expect(authService.signin).toHaveBeenCalledWith(signinDto);
      expect(authService.signin).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from authService', async () => {
      const signinDto: SigninDto = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      const error = new Error('Invalid credentials');
      mockAuthService.signin.mockRejectedValue(error);

      await expect(controller.signin(signinDto)).rejects.toThrow(error);
      expect(authService.signin).toHaveBeenCalledWith(signinDto);
    });
  });
});
