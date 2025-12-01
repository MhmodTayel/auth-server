import {
  Controller,
  Get,
  Patch,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req) {
    const userId = req.user?.id; // From JWT token //TODO
    return this.usersService.findOne(userId);
  }

  @Patch('me')
  async updateProfile(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userId = req.user?.id; // From JWT token //TODO
    return this.usersService.update(userId, updateUserDto);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = req.user?.id; // From JWT token //TODO
    return this.usersService.changePassword(userId, changePasswordDto);
  }
}