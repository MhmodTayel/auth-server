import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Config } from './config/config';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(Logger));
  app.use(helmet());
  const configService = app.get(ConfigService<Config, true>)
  const appConfig = configService.get('app', { infer: true })
  const isProduction = appConfig.nodeEnv === 'production';

  app.enableCors({
    origin: isProduction
      ? ['https://productiondomain.com'] //TODO
      : ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalFilters(new AllExceptionsFilter(app.get(Logger))); 

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(appConfig.port ?? 3000);
}
bootstrap();
