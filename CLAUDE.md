# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Development Commands

```bash
npm run dev          # Start Next.js dev server at http://localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests
npm test -- --watch  # Run tests in watch mode
npm test -- --coverage   # Tests with coverage
npm run server       # Start Express API server at http://localhost:3001
npm run server:dev   # Start Express server with hot reload
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: React Context + useReducer
- **API**: Next.js API Routes (Vercel) + Express (standalone)
- **Deployment**: Vercel

### Project Structure
```
/app                    # Next.js App Router
  /api                  # API routes (serverless functions)
    /game               # Game API endpoints
  layout.tsx            # Root layout
  page.tsx              # Home page
  globals.css           # Global styles

/components
  /ui                   # shadcn/ui components
  /game                 # Game-specific components
  GameApp.tsx           # Main game component

/lib
  /game                 # Game logic
    GameContext.tsx     # State management
    actions.ts          # Player actions
    generators.ts       # Content generation
  utils.ts              # Utility functions

/hooks
  useGameFeedback.ts    # Achievement/feedback system

/server                 # Express server (standalone)
  index.ts              # Server entry point
  /routes               # API routes

/__tests__              # Test files
```

### Core Game Loop
The game uses React Context + useReducer for centralized state management:
- `lib/game/GameContext.tsx` contains all game state, reducer logic, and localStorage persistence
- Four reducer action types:
  - `PERFORM_ACTION` - Execute player action, deduct costs, advance turn, generate events
  - `RESOLVE_EVENT` - Handle player choice for interactive events
  - `RESET_GAME` - Start fresh game
  - `CLEAR_CRITICAL_FLAG` - Clear critical hit notification

### State Flow
1. User clicks action in ActionPanel
2. Component dispatches to reducer
3. Reducer validates costs, executes action, applies outcomes
4. 10% chance for critical hit (2x multiplier)
5. Events may generate (30% chance per turn, guaranteed turn 1)
6. Victory/defeat checked (80% avg support wins, 100% risk loses)
7. State auto-saved to localStorage
8. Components re-render with Framer Motion animations

### Game State Shape
```typescript
interface GameState {
  turn: number;
  support: { [stateCode: string]: number };  // 0-100 per state
  clout: number;      // reputation currency
  funds: number;      // money for actions
  risk: number;       // 0-100, game over at 100
  advisors: Advisor[];
  newsLog: string[];
  socialFeed: Tweet[];
  pendingEvent?: GameEvent;  // blocks actions until resolved
  victory: boolean;
  gameOver: boolean;
  // Gamification
  streak: number;
  highestStreak: number;
  lastActionWasCritical: boolean;
  totalCriticalHits: number;
  sessionFirstAction: boolean;
  achievementsUnlocked: string[];
}
```

### Action System
Actions defined in `lib/game/actions.ts`:
- `meme_campaign` - Costs 10 clout, boosts 3 random states +5%, +5 risk
- `fundraise` - No cost, +$50 funds, +2 risk
- `rally` - Costs $30, +10% support in lowest state, +3 risk
- `bot_army` - Costs $20 + 5 clout, +3% all states, +15 risk

### Event System
- Events generated via `generateEvent()` in generators.ts
- Two types:
  - **Narrative events** - No choices, outcome applied immediately
  - **Interactive events** - Player must choose from options
- `pendingEvent` blocks all actions until resolved via `RESOLVE_EVENT`

### API Routes (Vercel)
- `GET /api/health` - Health check
- `GET /api/game/advisors` - Generate advisors
- `POST /api/game/event` - Generate event based on game state
- `POST /api/game/tweets` - Generate social media reactions
- `GET /api/game/initial-state` - Get initial game state

### Component Structure
- **GameApp** - Main game container with modals
- **MapView** - USA map with color-coded support levels
- **EventFeed** - Stats bar, risk meter, news log, social media
- **ActionPanel** - Action cards with costs and effects
- **AdvisorsPanel** - NPC advisors with quotes
- **IntroTutorial** - Game briefing explaining mechanics

### shadcn/ui Components
Located in `/components/ui`:
- Button, Card, Badge, Dialog, Progress

### Persistence
- Auto-saves to localStorage key `'gameSave'` on every state change
- Loads saved state on app start, falls back to fresh game if none exists

### Testing
- Tests in `/__tests__/` directory mirroring source structure
- Uses Jest + React Testing Library
- Run with `npm test`

### Dependencies
- Next.js 14
- React 18
- Tailwind CSS 3
- shadcn/ui (Radix primitives)
- Framer Motion
- Lucide React icons
- Express (standalone server)
- Sonner (toast notifications)

### Deployment
- Configured for Vercel deployment
- API routes become serverless functions
- See `vercel.json` for configuration
- leverage palywright mcp for testing