import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config, { Config } from './config/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core'
import { validate } from './config/env.validation';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: async (configService: ConfigService<Config>) => {
        const appConfig = configService.get('app')
        const isProduction = appConfig.nodeEnv === 'production';
        return {
          pinoHttp: {
            transport: isProduction
              ? undefined
              : {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  levelFirst: true,
                  translateTime: 'yyyy-mm-dd HH:MM:ss',
                  ignore: 'pid,hostname',
                  singleLine: false,
                },
              },
            level: isProduction ? 'info' : 'debug',
            serializers: {
              req: (req) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
              res: (res) => ({
                statusCode: res.statusCode,
              }),
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      envFilePath: '.env',
      validate,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService<Config>) => {
        const dbConfig = configService.get('database')
        return {
          uri: dbConfig.url
        }
      },
      inject: [ConfigService]
    }),
    UsersModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  }],
})
export class AppModule { }
