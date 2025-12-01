import { IsEmail, IsNotEmpty } from 'class-validator';

export class SigninDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}