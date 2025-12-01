import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status with timestamp', () => {
      const result = appController.getHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result.status).toBe('ok');
      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      ); 
    });

    it('should return a valid ISO timestamp', () => {
      const result = appController.getHealth();
      
      const date = new Date(result.timestamp);
      expect(date.toString()).not.toBe('Invalid Date');
      
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      expect(diff).toBeLessThan(5000);
    });
  });
});