import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty()
  email: string;

  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
    name: string;

    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/,
      {
        message: 'Password must contain at least one letter, one number, and one special character (@$!%*#?&)',
      },
    )
    password: string;
}