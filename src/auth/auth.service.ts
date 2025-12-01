import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SigninDto } from './dto/signin.dto';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {}

  async signup(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);

    const token = this.generateToken(user._id.toString(), user.email);

    this.logger.info(
      { userId: user._id, email: user.email },
      'User signed up successfully',
    );

    return {
      message: 'User registered successfully',
      access_token: token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async signin(signinDto: SigninDto) {
    const user = await this.usersService.findOneByEmail(signinDto.email, {
      includePassword: true,
    });

    if (!user) {
      this.logger.warn(
        { email: signinDto.email },
        'Signin failed: User not found',
      );

      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      signinDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user._id.toString(), user.email);

    this.logger.info(
      { userId: user._id, email: user.email },
      'User signed in successfully',
    );

    return {
      message: 'Signin successful',
      access_token: token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    };
  }

  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
