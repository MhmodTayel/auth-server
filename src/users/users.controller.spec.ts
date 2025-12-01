import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    findOne: jest.fn(),
    update: jest.fn(),
    changePassword: jest.fn(),
  };

  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true }) // Mock guard to bypass auth
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUserProfile = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findOne.mockResolvedValue(mockUserProfile);

      const result = await controller.getProfile(mockUser);

      expect(result).toEqual(mockUserProfile);
      expect(usersService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(usersService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from usersService', async () => {
      const error = new Error('User not found');
      mockUsersService.findOne.mockRejectedValue(error);

      await expect(controller.getProfile(mockUser)).rejects.toThrow(error);
      expect(usersService.findOne).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('updateProfile', () => {
    it('should update and return user profile', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const updatedUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Updated Name',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockUser, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(usersService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateUserDto,
      );
      expect(usersService.update).toHaveBeenCalledTimes(1);
    });

    it('should update email if provided', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'newemail@example.com',
      };

      const updatedUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'newemail@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockUser, updateUserDto);

      expect(result.email).toBe('newemail@example.com');
      expect(usersService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateUserDto,
      );
    });

    it('should propagate errors from usersService', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'existing@example.com',
      };

      const error = new Error('Email already exists');
      mockUsersService.update.mockRejectedValue(error);

      await expect(
        controller.updateProfile(mockUser, updateUserDto),
      ).rejects.toThrow(error);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
      };

      const mockResponse = {
        message: 'Password changed successfully',
      };

      mockUsersService.changePassword.mockResolvedValue(mockResponse);

      const result = await controller.changePassword(
        mockUser,
        changePasswordDto,
      );

      expect(result).toEqual(mockResponse);
      expect(usersService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        changePasswordDto,
      );
      expect(usersService.changePassword).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from usersService', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword456!',
      };

      const error = new Error('Current password is incorrect');
      mockUsersService.changePassword.mockRejectedValue(error);

      await expect(
        controller.changePassword(mockUser, changePasswordDto),
      ).rejects.toThrow(error);
      expect(usersService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        changePasswordDto,
      );
    });
  });
});
