# Contributing Guide

## Git Workflow

This project uses Husky for automated git hooks and follows conventional commit standards.

### Commit Message Format

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Changes to build system or dependencies
- `ci`: Changes to CI configuration files
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

#### Examples

```bash
feat: add user authentication with JWT
fix: resolve password hashing issue in signup
docs: update README with installation steps
test: add unit tests for AuthService
ci: configure GitHub Actions workflow
```

### Pre-commit Hooks

Before each commit, the following checks run automatically:

1. **Lint-staged**: Runs ESLint and Prettier on staged files
2. **Commit-msg**: Validates commit message format

### Making Changes

1. **Create a branch**

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**
   - Write clean, tested code
   - Follow existing code style

3. **Stage your changes**

   ```bash
   git add .
   ```

4. **Commit with conventional format**

   ```bash
   git commit -m "feat: add new feature"
   ```

   The pre-commit hook will:
   - Automatically format and lint staged files
   - Validate your commit message format

5. **Push your changes**
   ```bash
   git push origin feat/your-feature-name
   ```

### Running Tests Locally

Before pushing, ensure all tests pass:

```bash
# Run all checks
npm run lint                  # ESLint
npm run format               # Prettier format
npm run test                 # Unit tests
npm run test:cov            # Unit tests with coverage
npm run test:e2e            # E2E tests
npm run build               # Build check
```

### CI/CD Pipeline

On push or pull request, GitHub Actions will run:

1. **Lint Job**: ESLint, Prettier, Commit message validation
2. **Unit Tests Job**: Run on Node 18.x and 20.x with coverage
3. **E2E Tests Job**: Full integration tests with MongoDB
4. **Build Job**: Verify the application builds successfully

All jobs must pass before merging.

### Bypassing Hooks (Not Recommended)

In rare cases, you can skip hooks:

```bash
git commit --no-verify -m "emergency fix"
```

**⚠️ Warning**: Only use this in emergencies. CI will still validate everything.
