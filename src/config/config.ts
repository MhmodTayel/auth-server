import { registerAs } from '@nestjs/config';


interface DatabaseConfig {
  url: string;
}

export interface AppConfig {
  port: number | string;
}

export interface Config {
  database: DatabaseConfig;
  app: AppConfig;
}

export default registerAs('config', (): Config => {
  return {
    database: {
      url: process.env.MONGO_URI || 'mongodb://localhost:27017/authDB',
    },
    app: {
      port: process.env.PORT || 3000,
    },
  };
});