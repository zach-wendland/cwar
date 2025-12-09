# Culture War Tycoon

A satirical strategy game where you lead a digital movement competing to capture the national conversation. Build support across all 50 US states while managing resources and avoiding platform bans.

## Gameplay

You control a grassroots digital movement with a simple goal: achieve 80% average support across all states before your risk level triggers a total platform ban.

### Resources
- **Clout** - Reputation currency that fuels high-profile actions
- **Funds** - Cash to deploy across campaigns and rallies
- **Risk** - Heat from platforms and authorities (game over at 100%)
- **Support** - State-by-state backing displayed on the interactive US map

### Actions
- **Launch Meme Campaign** - Spend clout to boost support in random states
- **Fundraise** - Raise funds through crowdfunding
- **Organize Rally** - Target the lowest-support state for a boost
- **Deploy Bot Army** - High-risk nationwide influence boost

### Win/Lose Conditions
- **Victory**: Reach 80% average support across all states
- **Defeat**: Risk reaches 100% and platforms ban your movement

## Tech Stack

- React 18 with TypeScript
- Bootstrap 5 for styling
- react-usa-map for interactive state visualization
- React Testing Library for tests

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## Project Structure

```
src/
├── game/
│   ├── GameContext.tsx   # Central state management (React Context + useReducer)
│   ├── actions.ts        # Player action definitions with costs and effects
│   └── generators.ts     # Event, advisor, and social media content generation
├── components/
│   ├── MapView.tsx       # Interactive US map showing state support levels
│   ├── EventFeed.tsx     # News log and social media feed
│   ├── ActionPanel.tsx   # Available player actions
│   ├── AdvisorsPanel.tsx # NPC advisor display
│   └── IntroTutorial.tsx # Game briefing and tutorial
└── App.tsx               # Main layout and event modal handling
```
