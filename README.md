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

### Running Tests
```bash
npm test
# or
yarn test
```

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

