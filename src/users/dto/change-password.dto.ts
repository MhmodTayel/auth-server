import { IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/,
    {
      message: 'New password must contain at least one letter, one number, and one special character (@$!%*#?&)',
    },
  )
  newPassword: string;
}