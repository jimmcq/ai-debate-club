# AI Debate Club

A real-time web application that orchestrates structured debates between two distinct AI personalities on user-defined topics. Users act as moderators, initiating debates, injecting dynamic challenges mid-discussion, and scoring the final outcome.

## Features

- **Persona-Driven Debates**: Choose from four distinct AI personalities (Logician, Showman, Skeptic, Optimist)
- **Structured 4-Turn Format**: Opening statements (1 turn each), rebuttals (2 turns with back-and-forth), and closing arguments (1 turn each)
- **Moderator "Curveballs"**: Inject dynamic challenges during the rebuttal phase
- **User Scoring**: Vote for a winner at the conclusion
- **Topic Suggestions**: "Surprise Me" feature for engaging debate topics
- **Cost-Optimized**: Efficient prompt engineering keeps costs under $0.50/month for hobby use

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Next.js Route Handlers (Node.js runtime)
- **LLM Provider**: Groq API (Llama 3.1 8B-Instant)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (Hobby Tier)

## 🏗️ Architecture Deep Dive

This project demonstrates production-grade architecture patterns:
- **Resilience**: Circuit breakers, retry logic, graceful degradation
- **Observability**: Structured logging, error tracking, performance monitoring
- **Quality**: 152 focused tests, automated CI/CD, performance budgets
- **Security**: CSP headers, input validation, secure API handling

→ [Read the full Architecture Document](ARCHITECTURE.md)

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Groq API key

### Installation

1. Clone the repository:

    ```bash
    git clone <repository-url>
    cd ai-debate-club
    ```

2. Install dependencies:

    ```bash
    npm install
    # or
    yarn install
    ```

3. Set up environment variables:

    ```bash
    cp .env.example .env.local
    ```

    Edit `.env.local` and add your Groq API key:

    ```
    GROQ_API_KEY=your_groq_api_key_here
    ```

4. Run the development server:

    ```bash
    npm run dev
    # or
    yarn dev
    ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── debate/        # Debate-related endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── debate/           # Debate-specific components
│   └── ui/               # Reusable UI components
└── lib/                  # Shared utilities
    ├── api/              # API utilities
    ├── debate/           # Debate logic
    ├── personas/         # AI personality configs
    └── types/            # TypeScript definitions
```

## API Endpoints

### Start a Debate

```
POST /api/debate/start
Content-Type: application/json

{
  "topic": "Remote work is better than office work",
  "persona1Type": "logician",
  "persona2Type": "showman"
}
```

### Generate Next Message

```
POST /api/debate/message
Content-Type: application/json

{
  "debateId": "uuid",
  "curveball": "Switch sides and argue for the opposite position"
}
```

### Get Debate State

```
GET /api/debate/message?id=uuid
```

## AI Personas

- **The Logician**: Structured reasoning, evidence-based arguments, logical frameworks
- **The Showman**: Charismatic and persuasive, uses rhetoric and emotional appeal
- **The Skeptic**: Questions assumptions, challenges conventional wisdom
- **The Optimist**: Focuses on possibilities, benefits, and positive outcomes

## Cost Management

The application is designed for cost efficiency:

- **Token Optimization**: ~350 input + 220 output tokens per message
- **Cost per Debate**: ~$0.0004 (4,560 tokens total for 8 messages)
- **Monthly Hobby Scale**: 1,250 debates cost < $0.50

## Development

### Testing Strategy

This project employs a comprehensive testing philosophy that prioritizes **real bug detection over metrics**. Our approach is designed to catch actual issues that affect users, not just boost coverage numbers.

#### Testing Philosophy

**"Senior engineers write tests that catch real bugs, not just boost metrics."**

Our testing approach focuses on:

- **Business Logic Validation**: Core debate flow, persona integration, and state management
- **Error Handling Coverage**: All error types, retry logic, and circuit breaker patterns
- **Integration Testing**: Cross-module interactions and data consistency
- **Component Testing**: Key user flows and accessibility compliance
- **Edge Case Handling**: Negative inputs, boundary conditions, and failure scenarios

#### Test Structure

```
__tests__/
├── unit/                    # Unit tests for business logic
│   ├── lib/
│   │   ├── api/            # API retry logic, circuit breakers
│   │   ├── debate/         # Debate utilities and validation
│   │   ├── errors/         # Error handling and factories
│   │   └── personas/       # Persona configurations
├── integration/            # Cross-module integration tests
│   └── logic/             # Business logic integration
└── components/            # React component tests
    └── debate/           # Debate UI components
```

#### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test types
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:component    # Component tests only

# Watch mode for development
npm run test:watch

# CI mode (no watch, with coverage)
npm run test:ci
```

#### Test Coverage

Current coverage focuses on business-critical modules:

- **Error Handling**: 100% coverage with all error types and inheritance chains
- **Personas**: 100% coverage with all 8 personality configurations
- **Debate Utils**: 92% coverage with comprehensive edge case testing
- **API Retry Logic**: 71% coverage with circuit breaker patterns

**Total**: 135 tests with 100% pass rate, prioritizing quality over quantity.

#### Key Testing Tools

- **Jest**: Testing framework optimized for Next.js and TypeScript
- **React Testing Library**: Component testing with accessibility focus
- **Mock Service Worker (MSW)**: API mocking for integration tests
- **Custom Test Utilities**: Shared providers and testing helpers

#### Contributing Tests

When adding new features:

1. **Write business logic tests first** - Cover core functionality thoroughly
2. **Test error scenarios** - How does your code handle failures?
3. **Integration tests for cross-cutting concerns** - Does it work with other modules?
4. **Component tests for user-facing features** - Can users actually use it?
5. **Focus on realistic scenarios** - Test what will actually break in production

### Building for Production

```bash
npm run build
# or
yarn build
```

### Linting

```bash
npm run lint
# or
yarn lint
```

## 👨‍💻 Author

**Jim McQuillan**

- 🌐 GitHub: [@jimmcq](https://github.com/jimmcq)
- 💼 LinkedIn: [jimmcquillan](https://linkedin.com/in/jimmcquillan/)

## Deployment

### Vercel Deployment (Recommended)

This project is optimized for deployment on Vercel:

1. **Connect to Vercel:**

    ```bash
    npm install -g vercel
    vercel
    ```

2. **Set Environment Variables:**
   In your Vercel dashboard, add:
    - `GROQ_API_KEY` - Your Groq API key

3. **Automatic Deployments:**
    - Push to `main` branch triggers production deployment
    - Pull requests create preview deployments
    - All deployments run through CI/CD pipeline

### Manual Deployment

For other platforms:

```bash
# Build the application
npm run build

# Start the production server
npm start
```

### Environment Variables

| Variable       | Description                      | Required | Example      |
| -------------- | -------------------------------- | -------- | ------------ |
| `GROQ_API_KEY` | Groq API key for AI model access | ✅       | `gsk_...`    |
| `NODE_ENV`     | Environment mode                 | ❌       | `production` |

### CI/CD Pipeline

The project includes a comprehensive CI/CD pipeline with:

- **Pre-commit Hooks**: Lint, format, and test changes
- **GitHub Actions**:
    - ✅ Lint and format checking
    - ✅ Complete test suite (152 tests)
    - ✅ TypeScript compilation
    - ✅ Security audit
    - ✅ Build verification
    - 🔍 Lighthouse performance testing
    - 🚀 Automatic Vercel deployment

**Pipeline Requirements for Deployment:**

- All tests must pass (152/152)
- Linting must pass
- TypeScript compilation must succeed
- Security audit must not find high-severity issues
- Build must complete successfully

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the coding standards
4. Run tests and ensure they pass (`npm test`)
5. Run linting and formatting (`npm run lint:fix && npm run format`)
6. Commit your changes (triggers pre-commit hooks)
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Quality Standards

- **Tests Required**: All new features must include tests
- **100% Test Pass Rate**: No failing tests allowed
- **Linting**: Code must pass ESLint rules
- **Formatting**: Code must be formatted with Prettier
- **TypeScript**: Strong typing required, no `any` types
- **Performance**: Lighthouse scores must meet thresholds

### Pre-commit Hooks

The project automatically runs on commit:

- ESLint with auto-fix
- Prettier formatting
- Test suite execution

If any check fails, the commit will be blocked.

## License

MIT License - see LICENSE file for details
