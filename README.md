# Basketball Team Manager

A mobile-friendly web application for managing youth basketball teams. Track players, manage game rotations, record statistics, and ensure fair play time distribution.

## Features

### Player Management
- Add, edit, and delete players
- Track player jersey numbers
- Search players by name or number

### Game Scheduling
- Schedule games with opponent, date, and location
- Mark player attendance
- Track game status (scheduled, in-progress, completed)

### Game Day Interface
- **Smart Rotation Management**: Get AI-powered recommendations for player rotations based on play time
- **Live Stat Tracking**: Quick-tap buttons for steals, rebounds, and shooting stats
- **Flexible Swaps**: 8 swaps per game (2 per quarter) with 4-minute intervals
- **Emergency Substitutions**: Split swaps for injured players (2 minutes each)
- **Mobile-Optimized**: Large touch targets for easy use during fast-paced games

### Statistics & Analytics
- Season-wide statistics for all players
- Individual player detail views
- Normalized play time (accounts for games attended)
- Shooting percentages and point totals
- Visual indicators for players falling behind in play time

### Data Management
- **Local Storage**: All data stored in browser (no server required)
- **Export/Import**: Easily backup and transfer data between devices
- **Future-Ready**: Architecture supports remote API integration

## Live Demo

Visit the live app: [Basketball Team Manager](https://kjljon.github.io/Basketball-Team-Manager/)

## Installation & Development

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/KJLJon/Basketball-Team-Manager.git
cd Basketball-Team-Manager

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
# Build the app
npm run build

# Preview production build
npm run preview
```

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test

# Run tests with coverage
npm run test:coverage
```

## Deployment

### GitHub Pages (Automatic)

This project is configured to automatically deploy to GitHub Pages when you push to the `main` branch.

**Setup Instructions:**

1. Go to your repository settings
2. Navigate to Pages → Build and deployment
3. Set Source to "GitHub Actions"
4. Push to main branch - the app will automatically deploy

The app will be available at: `https://[your-username].github.io/Basketball-Team-Manager/`

### Manual Deployment

```bash
# Build the app
npm run build

# The dist/ folder contains the production build
# Upload this folder to any static hosting service
```

## Usage Guide

### Getting Started

1. **Add Players**
   - Navigate to the Players tab
   - Click "Add Player"
   - Enter player name and jersey number
   - Players can be edited or deleted later

2. **Schedule a Game**
   - Go to the Games tab
   - Click "Add Game"
   - Enter opponent name, date, and location

3. **Mark Attendance**
   - Click on a scheduled game
   - Select which players are attending
   - Save attendance before starting the game

4. **Start the Game**
   - From game setup, click "Save & Start Game"
   - The game begins at Quarter 1, Swap 1

### During the Game

#### Rotation Management
- The app shows 8 swaps total (2 per quarter, 4 minutes each)
- **Rotation Tab**: Select 5 players for current rotation
  - Green recommendations show players with least play time
  - System accounts for games attended (fair for all)
  - Click "Start Rotation" when 5 players are selected
- Click "Next Swap" to advance to the next rotation period

#### Stat Tracking
- **Stats Tab**: Track player statistics in real-time
- Select a player (players on court shown first)
- Quick-tap buttons for:
  - **Steals**: One tap to increment
  - **Rebounds**: One tap to increment
  - **Shooting**: Separate Miss/Made buttons for 1pt, 2pt, 3pt
- Made shots automatically increment both attempts and made stats

#### Emergency Substitutions
- If a player gets injured mid-swap:
  1. Note which player needs to come out
  2. Select replacement player
  3. System splits the 4-minute swap into 2 minutes each
  4. Both players get accurate play time

### After the Game

1. Click "End Game" when finished
2. All statistics are automatically saved
3. View team stats in the Stats tab
4. Click on individual players to see detailed statistics

### Statistics

The Stats tab shows:
- **Team Overview**: Total players and games played
- **Sortable Lists**: Sort by play time, points, rebounds, etc.
- **Color Indicators**:
  - 🔴 Red: Below 75% of average play time
  - 🟡 Yellow: Below 90% of average play time
  - 🟢 Green: At or above average play time
- **Individual Details**: Tap any player for game-by-game breakdown

### Data Backup

**Export Data:**
1. Go to Home tab
2. Click "Export Data"
3. Downloads a JSON file with all your data

**Import Data:**
1. Click "Import Data" (implementation can be added)
2. Select your previously exported JSON file
3. Confirms before overwriting existing data

## Architecture

### Technology Stack
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling (mobile-first)
- **React Router**: Client-side routing
- **Vitest**: Unit testing

### Project Structure
```
src/
├── components/       # React components
│   ├── common/      # Reusable UI components
│   ├── game/        # Game management components
│   ├── player/      # Player management components
│   └── stats/       # Statistics components
├── services/        # Business logic
│   ├── storage.ts   # LocalStorage abstraction
│   ├── player.ts    # Player operations
│   ├── game.ts      # Game operations
│   ├── stats.ts     # Statistics calculations
│   └── rotation.ts  # Rotation recommendations
├── types/           # TypeScript interfaces
├── utils/           # Utility functions
├── hooks/           # Custom React hooks
└── pages/           # Page components
```

### Key Algorithms

**Rotation Recommendation:**
```
1. Filter players attending current game
2. Calculate normalized play time = total minutes / games attended
3. Sort by normalized play time (ascending)
4. For ties, use total play time (ascending)
5. Return top N players
```

**Play Time Tracking:**
- Each rotation = 4 minutes (default)
- Emergency substitution = 2 minutes per player
- Total calculated across all rotations per game
- Normalized by dividing by games attended

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Data Privacy

All data is stored locally in your browser using localStorage. No data is sent to any server. You maintain complete control over your data.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC License

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for youth basketball coaches
