import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let jwtToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());

    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    await mongoConnection.dropDatabase();
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /api/v1 should return health status', () => {
      return request(app.getHttpServer())
        .get('/api/v1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          password: 'Password123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.user.name).toBe('Test User');
          expect(res.body.user).not.toHaveProperty('password');
          jwtToken = res.body.access_token;
          userId = res.body.user.id;
        });
    });

    it('should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'test@example.com',
          name: 'Test User 2',
          password: 'Password123!',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Email already exists');
        });
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'invalid-email',
          name: 'Test User',
          password: 'Password123!',
        })
        .expect(400);
    });

    it('should reject short name', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'test2@example.com',
          name: 'Ab',
          password: 'Password123!',
        })
        .expect(400);
    });

    it('should reject weak password (too short)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'test2@example.com',
          name: 'Test User',
          password: 'weak',
        })
        .expect(400);
    });

    it('should reject password without number', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'test2@example.com',
          name: 'Test User',
          password: 'Password!',
        })
        .expect(400);
    });

    it('should reject password without special character', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'test2@example.com',
          name: 'Test User',
          password: 'Password123',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/signin', () => {
    it('should sign in with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('should reject invalid password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid credentials');
        });
    });

    it('should reject non-existent email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid credentials');
        });
    });
  });

  describe('Protected Routes', () => {
    describe('GET /api/v1/users/me', () => {
      it('should get current user profile with valid token', () => {
        return request(app.getHttpServer())
          .get('/api/v1/users/me')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.email).toBe('test@example.com');
            expect(res.body.name).toBe('Test User');
            expect(res.body).not.toHaveProperty('password');
          });
      });

      it('should reject request without token', () => {
        return request(app.getHttpServer())
          .get('/api/v1/users/me')
          .expect(401);
      });

      it('should reject request with invalid token', () => {
        return request(app.getHttpServer())
          .get('/api/v1/users/me')
          .set('Authorization', 'Bearer invalid.token.here')
          .expect(401);
      });
    });

    describe('PATCH /api/v1/users/me', () => {
      it('should update user profile', () => {
        return request(app.getHttpServer())
          .patch('/api/v1/users/me')
          .set('Authorization', `Bearer ${jwtToken}`)
          .send({
            name: 'Updated Name',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.name).toBe('Updated Name');
            expect(res.body.email).toBe('test@example.com');
          });
      });

      it('should update email', () => {
        return request(app.getHttpServer())
          .patch('/api/v1/users/me')
          .set('Authorization', `Bearer ${jwtToken}`)
          .send({
            email: 'newemail@example.com',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.email).toBe('newemail@example.com');
          });
      });

      it('should reject invalid email format', () => {
        return request(app.getHttpServer())
          .patch('/api/v1/users/me')
          .set('Authorization', `Bearer ${jwtToken}`)
          .send({
            email: 'invalid-email',
          })
          .expect(400);
      });

      it('should reject request without token', () => {
        return request(app.getHttpServer())
          .patch('/api/v1/users/me')
          .send({
            name: 'New Name',
          })
          .expect(401);
      });
    });

    describe('PATCH /api/v1/users/me/password', () => {
      it('should change password with valid current password', () => {
        return request(app.getHttpServer())
          .patch('/api/v1/users/me/password')
          .set('Authorization', `Bearer ${jwtToken}`)
          .send({
            currentPassword: 'Password123!',
            newPassword: 'NewPassword456!',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.message).toBe('Password changed successfully');
          });
      });

      it('should be able to sign in with new password', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/signin')
          .send({
            email: 'newemail@example.com',
            password: 'NewPassword456!',
          })
          .expect(200);
      });

      it('should reject old password after change', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/signin')
          .send({
            email: 'newemail@example.com',
            password: 'Password123!',
          })
          .expect(401);
      });

      it('should reject change with incorrect current password', () => {
        return request(app.getHttpServer())
          .patch('/api/v1/users/me/password')
          .set('Authorization', `Bearer ${jwtToken}`)
          .send({
            currentPassword: 'WrongPassword123!',
            newPassword: 'NewPassword789!',
          })
          .expect(401);
      });

      it('should reject weak new password', () => {
        return request(app.getHttpServer())
          .patch('/api/v1/users/me/password')
          .set('Authorization', `Bearer ${jwtToken}`)
          .send({
            currentPassword: 'NewPassword456!',
            newPassword: 'weak',
          })
          .expect(400);
      });
    });
  });
});

