# Contributing to PipeLens

Thank you for your interest in contributing to PipeLens! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/pipe-lens.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit your changes: `git commit -m 'feat: add your feature'`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- MongoDB 7+
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rajsibajsi/pipe-lens.git
   cd pipe-lens
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start MongoDB:
   ```bash
   # Using Docker
   docker-compose up -d mongodb
   
   # Or start MongoDB locally
   mongod
   ```

4. Start the development servers:
   ```bash
   # Start all services
   pnpm run dev
   
   # Or start individually
   pnpm run dev:api    # API server on port 3001
   pnpm run dev:web    # Web app on port 5173
   ```

### Environment Variables

Create a `.env` file in the root directory:

```env
# API
PORT=3001
MONGODB_URI=mongodb://localhost:27017/pipe-lens
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Web
VITE_API_URL=http://localhost:3001
```

## Contributing Guidelines

### Branch Naming

Use descriptive branch names with prefixes:

- `feat/` - New features
- `fix/` - Bug fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `perf/` - Performance improvements

Examples:
- `feat/user-authentication`
- `fix/monaco-editor-update`
- `chore/update-dependencies`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Examples:
- `feat(auth): add user login functionality`
- `fix(monaco): resolve editor update issue`
- `docs: update API documentation`

## Pull Request Process

1. **Create a Pull Request** from your feature branch to `main`
2. **Fill out the PR template** completely
3. **Ensure all checks pass**:
   - Linting
   - Type checking
   - Tests
   - E2E tests
   - Security scans
   - Performance tests
4. **Request review** from maintainers
5. **Address feedback** and make necessary changes
6. **Squash commits** if requested
7. **Merge** after approval

### PR Requirements

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
- [ ] Performance impact considered
- [ ] Security implications reviewed

## Issue Reporting

### Before Creating an Issue

1. Search existing issues
2. Check if it's already reported
3. Verify it's not a duplicate

### Bug Reports

Use the bug report template and include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots if applicable

### Feature Requests

Use the feature request template and include:

- Clear description of the feature
- Use cases and benefits
- Implementation ideas (if any)
- Related issues

## Coding Standards

### General

- Use TypeScript for all new code
- Follow ESLint and Biome configurations
- Use meaningful variable and function names
- Write self-documenting code
- Add comments for complex logic

### Svelte

- Use Svelte 5 runes (`$state`, `$effect`, `$derived`)
- Prefer composition over inheritance
- Use proper TypeScript types
- Follow component naming conventions

### API

- Use proper HTTP status codes
- Follow RESTful conventions
- Validate input data
- Handle errors gracefully
- Use proper TypeScript types

### Database

- Use Mongoose schemas
- Validate data at the schema level
- Use proper indexing
- Handle connection errors

## Testing

### Unit Tests

- Write tests for all new functions
- Aim for high code coverage
- Use descriptive test names
- Test edge cases and error conditions

### Integration Tests

- Test API endpoints
- Test database operations
- Test component interactions

### E2E Tests

- Test critical user flows
- Use Playwright for browser testing
- Test on multiple browsers
- Test responsive design

### Running Tests

```bash
# Run all tests
pnpm run test

# Run unit tests
pnpm run test:unit

# Run E2E tests
pnpm run test:e2e

# Run tests with coverage
pnpm run test:coverage
```

## Documentation

### Code Documentation

- Document all public APIs
- Use JSDoc comments
- Include examples where helpful
- Keep documentation up to date

### README Updates

- Update README for new features
- Include setup instructions
- Document configuration options
- Add troubleshooting section

### API Documentation

- Document all endpoints
- Include request/response examples
- Document error codes
- Keep OpenAPI spec updated

## Performance Guidelines

- Optimize bundle sizes
- Use lazy loading where appropriate
- Minimize re-renders
- Use proper caching strategies
- Monitor performance metrics

## Security Guidelines

- Never commit secrets or API keys
- Validate all input data
- Use proper authentication
- Follow OWASP guidelines
- Keep dependencies updated

## Release Process

1. Update version numbers
2. Update CHANGELOG.md
3. Create release notes
4. Tag the release
5. Deploy to production

## Getting Help

- Check existing issues and discussions
- Ask questions in GitHub Discussions
- Contact maintainers directly
- Join our community chat (if available)

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to PipeLens! 🚀
