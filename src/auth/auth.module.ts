import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Config } from '../config/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';


@Module({
  imports: [UsersModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService<Config>) => {
        const jwtConfig = configService.get('jwt')
        return {
          secret: jwtConfig.secret,
          signOptions: { expiresIn: jwtConfig.expiresIn },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule { }
