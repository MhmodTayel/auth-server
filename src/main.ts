import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Config } from './config/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<Config, true>)
  const appConfig = configService.get('app', { infer: true })
  await app.listen(appConfig.port ?? 3000);
}
bootstrap();
