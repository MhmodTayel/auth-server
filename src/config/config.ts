import { registerAs } from '@nestjs/config';


interface DatabaseConfig {
  url: string;
}

export interface AppConfig {
  port: number | string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface Config {
  database: DatabaseConfig;
  app: AppConfig;
  jwt: JwtConfig;
}

export default registerAs('', (): Config => {
  return {
    database: {
      url: process.env.MONGO_URI || 'mongodb://localhost:27017/authDB',
    },
    app: {
      port: parseInt(process.env.PORT || '3000', 10),
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'strong-jwt-secret',
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
  };
});