# 🔐 Auth Server API

> A modern, production-ready authentication backend built with NestJS, MongoDB, and TypeScript. Featuring comprehensive testing, CI/CD automation, and Docker containerization.

[![Tests](https://img.shields.io/badge/tests-66%20passing-success)](.)
[![Coverage](https://img.shields.io/badge/coverage-62.84%25-yellow)](.)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](.)
[![Node](https://img.shields.io/badge/node-18%20%7C%2020-green)](.)

---

## 🎯 Overview

This backend provides a complete authentication solution with user management, JWT-based security, and RESTful APIs. Built following SOLID principles and industry best practices for scalability and maintainability.

### What's Inside

```
Authentication   →  JWT tokens, bcrypt hashing, secure sessions
User Management  →  Profile CRUD, password changes, email validation
API Docs        →  Interactive Swagger UI with live testing
Security        →  Helmet, CORS, rate limiting, input validation
Logging         →  Pino structured logging with request tracking
Testing         →  42 unit + 24 E2E tests with 62.84% coverage
CI/CD           →  GitHub Actions with automated testing & builds
Deployment      →  Docker + Docker Compose for easy deployment
```

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js  ≥ 18.x
MongoDB  ≥ 7.x
npm      ≥ 9.x
```

### Installation

**Option 1: Local Development**

```bash
# 1. Clone and install
git clone <your-repo>
cd auth-server
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start MongoDB
# Ensure MongoDB is running on localhost:27017

# 4. Launch the app
npm run start:dev

# ✅ API ready at http://localhost:3000/api/v1
# 📚 Docs ready at http://localhost:3000/api/v1/docs
```

**Option 2: Docker (Recommended)**

```bash
# Start everything (API + MongoDB)
npm run docker:dev

# That's it! 🎉
# API: http://localhost:3000/api/v1
# Docs: http://localhost:3000/api/v1/docs
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file with these values:

```bash
# Server
NODE_ENV=development          # development | production | test
PORT=3000                     # API port

# Database
MONGO_URI=mongodb://localhost:27017/auth-dev

# Security
JWT_SECRET=min-32-chars-secret-key-change-in-production
JWT_EXPIRES_IN=7d            # Token lifetime: 1d, 7d, 24h, etc.
```

> **⚠️ Production Note**: `JWT_SECRET` must be minimum 32 characters in production environment

---

## 📡 API Reference

### Base URL

```
http://localhost:3000/api/v1
```

### Endpoints Overview

| Endpoint             | Method | Auth | Description       |
| -------------------- | ------ | ---- | ----------------- |
| `/`                  | GET    | No   | Health check      |
| `/auth/signup`       | POST   | No   | Register new user |
| `/auth/signin`       | POST   | No   | Login user        |
| `/users/me`          | GET    | Yes  | Get profile       |
| `/users/me`          | PATCH  | Yes  | Update profile    |
| `/users/me/password` | PATCH  | Yes  | Change password   |

### 📖 Interactive Documentation

Visit **`http://localhost:3000/api/v1/docs`** for Swagger UI with:

- Live API testing
- Request/response schemas
- Authentication examples
- Error codes reference

### Quick Examples

<details>
<summary><b>Signup</b></summary>

```bash
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePass123!"
}

# Response 201
{
  "access_token": "eyJhbGciOiJIUz...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

</details>

<details>
<summary><b>Signin</b></summary>

```bash
POST /api/v1/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Response 200
{
  "access_token": "eyJhbGciOiJIUz...",
  "user": { ... }
}
```

</details>

<details>
<summary><b>Get Profile</b></summary>

```bash
GET /api/v1/users/me
Authorization: Bearer <your-token>

# Response 200
{
  "id": "...",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

</details>

<details>
<summary><b>Update Profile</b></summary>

```bash
PATCH /api/v1/users/me
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

</details>

<details>
<summary><b>Change Password</b></summary>

```bash
PATCH /api/v1/users/me/password
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecure456!"
}
```

</details>

---

## 🐳 Docker Deployment

### Development Mode

```bash
# Start with hot reload
npm run docker:dev

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop
npm run docker:dev:down
```

### Production Mode

```bash
# Build and start
npm run docker:prod

# Stop
npm run docker:prod:down

# Clean up volumes
npm run docker:clean
```

### What's Running?

- **Backend**: `localhost:3000` (Node.js app)
- **MongoDB**: `localhost:27017` (Database)
- **Health Check**: Automatic container monitoring

---

## 🧪 Testing

```bash
# Run all tests
npm test                    # Unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # With coverage report

# Watch mode
npm run test:watch
```

### Test Results

```
✅ Unit Tests:  42 passing (6 suites)
✅ E2E Tests:   24 passing (2 suites)
✅ Total:       66 tests
📊 Coverage:    62.84%
```

**Coverage by Module:**

- Controllers: `100%`
- Services: `90%+`
- DTOs: `100%`
- Guards: `100%`

---

## 🔒 Security Features

### Authentication

- ✅ JWT-based stateless authentication
- ✅ Bcrypt password hashing (10 salt rounds)
- ✅ Token expiration with configurable lifetime
- ✅ Bearer token authorization

### Password Policy

Enforced password requirements:

- Minimum 8 characters
- At least 1 letter
- At least 1 number
- At least 1 special character (`!@#$%^&*`)

### API Protection

- ✅ **Helmet** - Security headers (XSS, clickjacking)
- ✅ **CORS** - Cross-origin resource sharing
- ✅ **Rate Limiting** - 100 req/min (default), 10 req/min (auth endpoints)
- ✅ **Input Validation** - Class-validator with DTOs
- ✅ **Error Handling** - Global exception filter

### Production Hardening

- ✅ Environment variable validation
- ✅ Non-root Docker user
- ✅ Password excluded from API responses
- ✅ Structured logging (no sensitive data)
- ✅ API versioning (`/api/v1`)

---

## 🏗️ Architecture

```
src/
├── auth/                    # Authentication Module
│   ├── decorators/          # @CurrentUser() decorator
│   ├── dto/                 # SigninDto
│   ├── guards/              # JwtAuthGuard
│   ├── strategies/          # Passport JWT strategy
│   ├── auth.controller.ts   # Signup/signin endpoints
│   ├── auth.service.ts      # Authentication logic
│   └── auth.module.ts
│
├── users/                   # User Module
│   ├── dto/                 # CreateUser, UpdateUser, ChangePassword
│   ├── entities/            # User schema (Mongoose)
│   ├── users.controller.ts  # Profile management endpoints
│   ├── users.service.ts     # User business logic
│   └── users.module.ts
│
├── common/                  # Shared Resources
│   └── filters/             # Global exception filter
│
├── config/                  # Configuration
│   ├── config.ts            # Type-safe config
│   └── env.validation.ts    # Startup validation
│
├── app.module.ts            # Root module
└── main.ts                  # Application bootstrap
```

---

## ⚙️ Development

### Available Scripts

```bash
npm run start:dev           # Development mode (hot reload)
npm run start:debug         # Debug mode (port 9229)
npm run start:prod          # Production mode
npm run build               # Build for production
npm run lint                # ESLint
npm run format              # Prettier
npm test                    # Run tests
npm run docker:dev          # Docker development
npm run docker:prod         # Docker production
```

### Code Quality Tools

- **ESLint** - Code linting with TypeScript rules
- **Prettier** - Code formatting
- **Husky** - Git hooks (pre-commit, commit-msg)
- **Lint-staged** - Run linters on staged files
- **Commitlint** - Conventional commit messages

### Git Hooks

**Pre-commit**: Automatically formats and lints staged files

**Commit-msg**: Validates commit message format

```
feat: add new feature
fix: resolve bug
docs: update documentation
test: add tests
chore: update dependencies
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Runs automatically on push/PR:

1. **Linting** ✨
   - ESLint code quality
   - Prettier formatting check
   - Commit message validation

2. **Unit Tests** 🧪
   - Run on Node 18.x & 20.x
   - Generate coverage reports
   - Upload to Codecov

3. **E2E Tests** 🔗
   - MongoDB container setup
   - Full integration testing
   - Real database operations

4. **Build** 📦
   - TypeScript compilation
   - Production build verification
   - Artifact creation

All jobs must pass before merging ✅

---

## 📊 Monitoring

### Logging

**Development**: Pretty-printed, colorized console logs

**Production**: JSON structured logs for log aggregation

**Features**:

- Request/response logging
- Error tracking with stack traces
- No sensitive data exposure
- Correlation IDs for request tracing

### Health Checks

- **HTTP**: `GET /api/v1` returns `200 OK` with timestamp
- **Docker**: Built-in container health monitoring
- **Database**: Connection verification on startup

---

## 🚢 Production Deployment

### Automated Deployment to EC2

This project includes automated CI/CD deployment to AWS EC2 using GitHub Actions and GitHub Container Registry (GHCR).

**Deployment Flow:**

```
Push to main → Tests → Build Docker Image → Push to GHCR → Deploy to EC2
```

### Quick Setup

1. **Prepare EC2 Instance**

   ```bash
   # SSH to EC2
   ssh -i your-key.pem ubuntu@your-ec2-ip

   # Install Docker & Docker Compose
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker ubuntu

   # Create deployment directory
   mkdir -p /home/ubuntu/deployment
   cd /home/ubuntu/deployment
   ```

2. **Configure GitHub Secrets**

   Add these in **Settings → Secrets → Actions**:
   - `EC2_HOST` - Your EC2 public IP
   - `EC2_USER` - `ubuntu`
   - `EC2_SSH_KEY` - Your EC2 private key (entire `.pem` file content)

3. **Create .env on EC2**

   ```bash
   # On EC2: /home/ubuntu/deployment/.env
   MONGO_USERNAME=admin
   MONGO_PASSWORD=your-secure-password
   MONGO_DATABASE=auth
   JWT_SECRET=your-32-char-secret-key
   JWT_EXPIRES_IN=7d
   ```

4. **Deploy**
   ```bash
   # Push to main branch
   git push origin main
   # GitHub Actions handles the rest!
   ```

### Manual Deployment

```bash
# On EC2
cd /home/ubuntu/deployment

# Pull latest image
docker login ghcr.io
docker pull ghcr.io/mhmodtayel/auth-server:latest

# Update and restart
export BACKEND_IMAGE=ghcr.io/mhmodtayel/auth-server:latest
docker compose up -d backend
```

### Production Checklist

- [ ] Set strong `JWT_SECRET` (min 32 characters)
- [ ] Configure MongoDB authentication
- [ ] Set up SSL/TLS certificates (Let's Encrypt)
- [ ] Configure CORS for your frontend domain
- [ ] Set `NODE_ENV=production`
- [ ] Review rate limits
- [ ] Set up log aggregation
- [ ] Configure monitoring/alerts
- [ ] Back up database regularly
- [ ] Test deployment pipeline

### Scaling

This application is **stateless** and **horizontally scalable**:

- Deploy multiple instances behind a load balancer
- JWT tokens eliminate session storage
- MongoDB supports replica sets & sharding
- Consider Redis for caching (optional)

---

## 🤝 Contributing

### Workflow

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit with conventional format: `git commit -m "feat: your feature"`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

### Standards

- ✅ Follow ESLint/Prettier rules
- ✅ Write tests (maintain 60%+ coverage)
- ✅ Use conventional commits
- ✅ Update docs if needed
- ✅ Ensure CI passes

---

## 🐛 Troubleshooting

**MongoDB Connection Failed**

```bash
# Check if MongoDB is running
docker ps | grep mongo
# Start MongoDB
docker compose up mongodb -d
```

**Port 3000 Already in Use**

```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>
```

**Tests Failing**

```bash
# Clear cache
npm run test -- --clearCache
# Run again
npm test
```

**Husky Not Working**

```bash
# Reinstall hooks
npm run prepare
```

---

## 📝 License

This project is **UNLICENSED**

---

## 🙏 Acknowledgments

Built with:

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [MongoDB](https://www.mongodb.com/) - Document database
- [Passport](http://www.passportjs.org/) - Authentication middleware
- [Swagger](https://swagger.io/) - API documentation
- [Docker](https://www.docker.com/) - Containerization

---

<div align="center">

**Made with ❤️ and TypeScript**

</div>
