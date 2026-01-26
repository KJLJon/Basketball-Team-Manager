# Game Components Guide

## GameDay.tsx
Main game management component with 4 tabs: Rotation, Current, Stats, Swaps.

**Props**: `game: Game`, `players: Player[]`, `onRefresh: () => void`

**Key State**:
- `currentView`: 'rotation' | 'current' | 'stats' | 'swaps'
- `sortBy`: 'name' | 'number'

**Key Functions**:
- `handleNextSwap()` - Advances to next swap, ends game at Q4S2
- `handleSwapPlayer(outId, inId)` - Mid-rotation substitution (2 min each)
- `handleIncrementStat/handleDecrementStat` - Stat tracking

## RotationSelector.tsx
Selects 5 players for current rotation with AI recommendations.

**Props**:
- `game`, `players`, `onRefresh`, `onNextSwap`
- `onRotationSaved?: () => void` - Called after saving, triggers tab switch

**Features**:
- Shows recommendations from `RotationService.recommendPlayers()`
- "Use All" applies all recommendations
- Saves rotation via `GameService.addRotation()`

## CurrentPlayerCard.tsx
Shows on-court player with stat buttons and swap capability.

**Props**:
- `player`, `stats`, `benchPlayers`
- `gameId`, `playersOnCourt` - For swap recommendations
- `onIncrementStat`, `onSwapPlayer`

**Features**:
- Quick stat buttons: Steal, Rebound, Made/Miss (with point type dropdown)
- Swap dialog with recommendations pre-selected
- Uses `RotationService.recommendPlayers()` for suggestions

## SwapsOverview.tsx
Grid view of all players × all swaps with editing capabilities.

**Props**: `game`, `players`, `allPlayers?`, `onRefresh`

**Features**:
- Toggle "Edit Rotations" to add/remove players from swaps
- "Edit Attendance" modal to change who's attending mid-game
- Adjust swap minutes (default 4, range 0-8)
- Shows swaps attended (X/8) per player
- Click player to edit their stats

**Key Functions**:
- `handleToggleAttendance(playerId)` - Add/remove from game attendance
- `handleAddPlayerToSwap/handleRemovePlayerFromSwap` - Edit rotations
- `handleUpdateSwapMinutes` - Change minutes for a swap

## RotationHistory.tsx
Read-only view of completed rotations for finished games.

## EditableStatRow.tsx
Increment/decrement row for stat editing with +/- buttons.

## StatButtonWithDropdown.tsx
Button with dropdown for selecting point type (1pt/2pt/3pt).
