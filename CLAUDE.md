# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nano Info is a React application that transforms text content into AI-generated visual infographics. Users can input text directly or upload documents (PDF, Word, TXT, MD), which are then processed by an AI to split into semantic content blocks. Each block can be rendered as a styled infographic image using configurable visual styles.

## Commands

```bash
pnpm dev        # Start development server
pnpm build      # TypeScript check + Vite production build
pnpm lint       # Run ESLint
pnpm preview    # Preview production build
```

## Architecture

### State Management
- **Zustand store** (`src/stores/useAppStore.ts`): Single global store with persistence for API configs and user preferences
- State is persisted to localStorage under key `nano-info-prompt-storage`

### Core Workflow
1. **Input**: User enters text or uploads a file (PDF/Word/TXT/MD)
2. **AI Processing** (`src/utils/aiWorkflow.ts`): Sends content to OpenAI-compatible API with a system prompt that splits content into semantic blocks with titles
3. **Style Selection**: User picks from 14 predefined visual styles (`src/data/visualStyles.ts`)
4. **Image Generation** (`src/utils/imageGeneration.ts`): Each content block can be rendered as an image via Gemini or OpenAI image APIs

### Key Files
- `src/App.tsx`: Main layout with sidebar controls and content preview area
- `src/types/index.ts`: All TypeScript interfaces and types
- `src/utils/fileParser.ts`: Document parsing using pdfjs-dist and mammoth
- `src/data/visualStyles.ts`: Visual style definitions with prompt templates

### API Integration
- **Text Processing**: OpenAI-compatible chat completions endpoint (configurable base URL)
- **Image Generation**: Supports both Gemini (`generateContent`) and OpenAI (`chat/completions`) providers
- Both APIs support SSE streaming responses

### UI Components
- Uses Radix UI primitives with shadcn/ui patterns
- Tailwind CSS v4 with `@tailwindcss/vite` plugin
- Path alias: `@/` maps to `src/`

## Language Note

The application UI and AI prompts are in Chinese (Simplified). Visual styles are designed to output Chinese text in generated images.
