import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { SigninDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,


  ) { }

  async signup(createUserDto: CreateUserDto) { 
    const user = await this.usersService.create(createUserDto);

    return {
      message: 'User registered successfully',
      user,
    };
  }

  async signin(signinDto: SigninDto) {
   
    const user = await this.usersService.findOneByEmail(signinDto.email, {
      includePassword: true,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

 
    const isPasswordValid = await bcrypt.compare(
      signinDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // TODO: Generate JWT token here (next step)
    return {
      message: 'Signin successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
