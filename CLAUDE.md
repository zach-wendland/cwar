# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Development Commands

```bash
npm start        # Start dev server at http://localhost:3000
npm run build    # Production build to build/
npm test         # Run tests in watch mode
npm test -- --coverage                    # Tests with coverage
npm test -- --testPathPattern=<path>      # Run specific test file
```

## Architecture Overview

### Core Game Loop
The game uses React Context + useReducer for centralized state management:
- `GameContext.tsx` contains all game state, reducer logic, and localStorage persistence
- Three reducer action types:
  - `PERFORM_ACTION` - Execute player action, deduct costs, advance turn, generate events
  - `RESOLVE_EVENT` - Handle player choice for interactive events
  - `RESET_GAME` - Start fresh game

### State Flow
1. User clicks action in ActionPanel
2. Component dispatches to reducer
3. Reducer validates costs, executes action, applies outcomes
4. Events may generate (30% chance per turn, guaranteed turn 1)
5. Victory/defeat checked (80% avg support wins, 100% risk loses)
6. State auto-saved to localStorage
7. Components re-render

### Key Files
- `src/game/GameContext.tsx` - State management, reducer, persistence
- `src/game/actions.ts` - 4 player actions with costs and effects
- `src/game/generators.ts` - Advisors, events, social media tweets
- `src/App.tsx` - Layout, event modal, victory/defeat screens

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
}
```

### Action System
Actions defined in `actionsConfig` array:
```typescript
interface GameActionConfig {
  id: string;
  name: string;
  description: string;
  cost?: { funds?: number; clout?: number };
  perform: (state: GameState) => EventOutcome;
}
```

Current actions:
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

### EventOutcome Interface
Standard delta object for all effects:
```typescript
interface EventOutcome {
  supportDelta?: { [state: string]: number };  // 'ALL' applies to all states
  cloutDelta?: number;
  fundsDelta?: number;
  riskDelta?: number;
  message?: string;
}
```

### Component Structure
- **MapView** - react-usa-map with color-coded support levels (gray→light green→medium green→dark green)
- **EventFeed** - Scrollable news log + social media tweets
- **ActionPanel** - Action buttons with cost display, disabled when insufficient resources
- **AdvisorsPanel** - 3 NPC advisors with quotes
- **IntroTutorial** - Game briefing explaining mechanics

### Persistence
- Auto-saves to localStorage key `'gameSave'` on every state change
- Loads saved state on app start, falls back to fresh game if none exists

### Testing
- Tests in `__tests__/` directories alongside source files
- Pattern: `ComponentName.test.tsx` or `moduleName.test.ts`
- Uses React Testing Library + Jest

### Dependencies
- React 18.2.0
- Bootstrap 5.3.0
- react-usa-map 1.1.0
- TypeScript 4.5.5
- React Testing Library
