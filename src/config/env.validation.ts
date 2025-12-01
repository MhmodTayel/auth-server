import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  MinLength,
  validateSync,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment, {
    message: 'NODE_ENV must be one of: development, production, test',
  })
  NODE_ENV: Environment = Environment.Development;

  @IsNumber({}, { message: 'PORT must be a valid number' })
  PORT: number = 3000;

  @IsString({ message: 'MONGO_URI must be a string' })
  @IsNotEmpty({ message: 'MONGO_URI is required' })
  MONGO_URI: string = 'mongodb://localhost:27017/auth-test';

  @IsString({ message: 'JWT_SECRET must be a string' })
  @ValidateIf(
    (o: EnvironmentVariables) => o.NODE_ENV === Environment.Production,
  )
  @MinLength(32, {
    message: 'JWT_SECRET must be at least 32 characters long for security.',
  })
  JWT_SECRET: string = 'test-secret-key-for-development-only-min-32-chars';

  @IsString({ message: 'JWT_EXPIRES_IN must be a string (e.g., "7d", "24h")' })
  @IsNotEmpty({ message: 'JWT_EXPIRES_IN is required' })
  JWT_EXPIRES_IN: string = '1d';
}

export function validate(config: Record<string, unknown>) {
  // Set defaults for missing values in non-production
  const configWithDefaults = {
    NODE_ENV: (config.NODE_ENV as string) || 'development',
    PORT: (config.PORT as number) || 3000,
    MONGO_URI:
      (config.MONGO_URI as string) || 'mongodb://localhost:27017/auth-test',
    JWT_SECRET:
      (config.JWT_SECRET as string) ||
      'test-secret-key-for-development-only-min-32-chars',
    JWT_EXPIRES_IN: (config.JWT_EXPIRES_IN as string) || '1d',
  };

  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    configWithDefaults,
    {
      enableImplicitConversion: true,
    },
  );

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const formattedErrors = errors
      .map((error) => {
        const constraints = error.constraints
          ? Object.values(error.constraints)
          : [];
        return ` ${error.property}: ${constraints.join(', ')}`;
      })
      .join('\n');

    throw new Error(
      `\n\n Environment variable validation failed:\n\n${formattedErrors}\n\n` +
        `Please check your .env file and ensure all required variables are set correctly.\n`,
    );
  }

  return validatedConfig;
}
