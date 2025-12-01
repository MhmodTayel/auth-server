import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    mockUserModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: '507f1f77bcf86cd799439011',
      save: jest
        .fn()
        .mockResolvedValue({ _id: '507f1f77bcf86cd799439011', ...dto }),
    }));

    mockUserModel.find = jest.fn();
    mockUserModel.findOne = jest.fn();
    mockUserModel.findById = jest.fn();
    mockUserModel.findByIdAndUpdate = jest.fn();
    mockUserModel.findByIdAndDelete = jest.fn();
    mockUserModel.create = jest.fn();
    mockUserModel.exec = jest.fn();
    mockUserModel.select = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: 'PinoLogger:UsersService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!',
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
        save: jest.fn().mockResolvedValue(this),
      };

      service.findOneByEmail = jest.fn().mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      mockUserModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        name: 'Test User',
        password: 'Password123!',
      };

      service.findOneByEmail = jest
        .fn()
        .mockResolvedValue({ email: 'existing@example.com' });

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('should find a user by id', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockUserModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOneByEmail', () => {
    it('should find a user by email with password', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      mockUserModel.findOne = jest.fn().mockReturnValue(mockQuery);

      const result = await service.findOneByEmail('test@example.com', {
        includePassword: true,
      });

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(mockQuery.select).toHaveBeenCalledWith('+password');
      expect(result).toEqual(mockUser);
    });

    it('should find a user by email without password', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      mockUserModel.findOne = jest.fn().mockReturnValue(mockQuery);

      const result = await service.findOneByEmail('TEST@EXAMPLE.COM');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      mockUserModel.findOne = jest.fn().mockReturnValue(mockQuery);

      const result = await service.findOneByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      const error = new Error('Database error');
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(error),
      };

      mockUserModel.findOne = jest.fn().mockReturnValue(mockQuery);

      await expect(service.findOneByEmail('test@example.com')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const mockUpdatedUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Updated Name',
      };

      mockUserModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUpdatedUser),
        }),
      });

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        updateDto,
      );

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateDto,
        { new: true },
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should update email after lowercasing it', async () => {
      const updateDto: UpdateUserDto = {
        email: 'NEWEMAIL@EXAMPLE.COM',
      };

      const mockUpdatedUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'newemail@example.com',
        name: 'Test User',
      };

      const mockQuery1 = {
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      mockUserModel.findOne = jest.fn().mockReturnValue(mockQuery1);

      mockUserModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUpdatedUser),
        }),
      });

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        updateDto,
      );

      expect(updateDto.email).toBe('newemail@example.com');
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should throw ConflictException when email already exists for another user', async () => {
      const updateDto: UpdateUserDto = {
        email: 'existing@example.com',
      };

      const existingUser = {
        _id: 'different-user-id',
        email: 'existing@example.com',
        name: 'Existing User',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(existingUser),
      };

      mockUserModel.findOne = jest.fn().mockReturnValue(mockQuery);

      await expect(
        service.update('507f1f77bcf86cd799439011', updateDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating own email', async () => {
      const updateDto: UpdateUserDto = {
        email: 'test@example.com',
      };

      const existingUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockUpdatedUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(existingUser),
      };

      mockUserModel.findOne = jest.fn().mockReturnValue(mockQuery);

      mockUserModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUpdatedUser),
        }),
      });

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        updateDto,
      );

      expect(result).toEqual(mockUpdatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      mockUserModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.update('nonexistent-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
      };

      const mockUser = {
        _id: userId,
        password: 'hashedOldPassword',
        save: jest.fn().mockResolvedValue(this),
      };

      mockUserModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true) // current password valid
        .mockResolvedValueOnce(false); // new password different

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');

      const result = await service.changePassword(userId, changePasswordDto);

      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for incorrect current password', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword456!',
      };

      const mockUser = {
        _id: userId,
        password: 'hashedPassword',
      };

      mockUserModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(userId, changePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if new password same as current', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'Password123!',
        newPassword: 'Password123!',
      };

      const mockUser = {
        _id: userId,
        password: 'hashedPassword',
      };

      mockUserModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.changePassword(userId, changePasswordDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = 'nonexistent-id';
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'Password123!',
        newPassword: 'NewPassword456!',
      };

      mockUserModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.changePassword(userId, changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
