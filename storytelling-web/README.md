# AI Joke Generator and Analysis Tool

A modern web application that generates jokes and provides detailed analysis of humor patterns using Next.js.

## Features

- Generate various types of jokes
- Analyze humor patterns and joke structure
- Get explanations of what makes jokes funny
- Modern, responsive interface
- Server-side rendering

## Prerequisites

- Node.js (version 18 or higher)
- npm or pnpm package manager

## Installation

1. Clone the repository
```bash
git clone https://github.com/carloscip/deai-bootcamp.git
cd storytelling-web
```

2. Install dependencies
```bash
pnpm install # or npm install
```

3. Add environment file
```bash
# create a .env.local file
touch .env.local
# add variable `OPENROUTER_API_KEY` to it
```

## Running the Application

1. Start the development server
```bash
pnpm dev # or npm run dev
```

2. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
joke-generator-ai/
├── app/            # Next.js app directory
├── components/     # React components
├── public/         # Static assets
├── styles/        # CSS and styling files
├── lib/           # Utility functions
├── types/         # TypeScript type definitions
└── README.md
```

## Built With

- Next.js
- React
- TypeScript
- Tailwind CSS

## License

MIT License
