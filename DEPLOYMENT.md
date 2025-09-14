# Deployment Guide

## GitHub Repository Setup

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

#### Required for CI/CD Pipeline

- `GROQ_API_KEY` - Your Groq API key for AI model access

#### Required for Vercel Deployment

- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

#### Optional for Enhanced Features

- `CODECOV_TOKEN` - For code coverage reporting (optional)
- `LHCI_GITHUB_APP_TOKEN` - For Lighthouse CI GitHub integration (optional)

### Getting Vercel Secrets

1. **Install Vercel CLI:**

    ```bash
    npm install -g vercel
    ```

2. **Login and Link Project:**

    ```bash
    vercel login
    vercel link
    ```

3. **Get Organization and Project IDs:**

    ```bash
    # This will show your org and project IDs
    cat .vercel/project.json
    ```

4. **Get Vercel Token:**
    - Go to [Vercel Account Settings](https://vercel.com/account/tokens)
    - Create a new token
    - Copy the token value

## Deployment Process

### Automatic Deployment (Recommended)

1. **Push to Main Branch:**

    ```bash
    git push origin main
    ```

2. **Pipeline Execution:**
    - ✅ Pre-commit hooks run (lint, format, test)
    - ✅ GitHub Actions execute full CI/CD pipeline
    - ✅ All quality gates must pass:
        - Linting and formatting
        - Complete test suite (152 tests)
        - TypeScript compilation
        - Security audit
        - Build verification
        - Lighthouse performance tests
    - 🚀 Automatic deployment to Vercel (if all checks pass)

### Manual Deployment

If you need to deploy manually:

```bash
# Build and deploy to Vercel
vercel --prod

# Or deploy to other platforms
npm run build
npm start
```

## Quality Gates

The CI/CD pipeline enforces these quality standards:

### Code Quality

- ✅ ESLint rules must pass
- ✅ Prettier formatting enforced
- ✅ TypeScript compilation without errors
- ✅ No high-severity security vulnerabilities

### Testing Requirements

- ✅ All 152 tests must pass (100% pass rate)
- ✅ Unit tests for business logic
- ✅ Integration tests for cross-module functionality
- ✅ Component tests for UI interactions

### Performance Standards

- ✅ Lighthouse Performance: ≥80/100
- ✅ Lighthouse Accessibility: ≥90/100
- ✅ Lighthouse Best Practices: ≥80/100
- ✅ Lighthouse SEO: ≥80/100

## Monitoring and Maintenance

### Automated Processes

- **Dependency Updates**: Weekly automated PRs for dependency updates
- **Performance Monitoring**: Daily Lighthouse audits
- **Security Scanning**: Continuous vulnerability monitoring

### Manual Monitoring

- Check Vercel deployment logs
- Monitor application performance
- Review Lighthouse reports
- Monitor error rates and user feedback

## Troubleshooting

### Common Issues

1. **Tests Failing:**

    ```bash
    npm test
    # Fix any failing tests before pushing
    ```

2. **Build Failures:**

    ```bash
    npm run build
    # Check for TypeScript errors or missing dependencies
    ```

3. **Lint Errors:**

    ```bash
    npm run lint:fix
    npm run format
    ```

4. **Vercel Deployment Issues:**
    - Check environment variables are set
    - Verify Vercel token permissions
    - Check build logs in Vercel dashboard

### Getting Help

- Check GitHub Actions logs for CI/CD issues
- Review Vercel deployment logs
- Ensure all required secrets are configured
- Verify environment variables match expected format

## Security Considerations

- Never commit API keys or secrets
- Use environment variables for all sensitive data
- Regular security audits through GitHub Actions
- Content Security Policy headers configured
- HTTPS enforced in production
