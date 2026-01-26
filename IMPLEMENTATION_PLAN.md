# Basketball Team Manager - Rotation Optimization Implementation Plan

## Overview
This plan addresses comprehensive improvements to player rotation optimization, attendance tracking, and game management features.

---

## Requirements Summary

### 1. Enhanced Rotation Algorithm
- Optimize for equal playing time within current game
- Factor in historical playing time across all games attended
- Precompute entire game roster to optimize fairness
- Visual indicators (colors) for players needing more/less rotation
- Tie-breaker: Players with fewer games attended get priority

### 2. Pre-Game Setup & Partial Attendance
- Start game with all players assumed present
- Allow attendance modification before first swap
- Track partial attendance (X/8 swaps attended)
- Support mid-game attendance changes (late arrivals/early departures)
- Partial attendance affects play time calculations proportionally

### 3. Add Misses Counter
- Display missed shot attempts on Current tab next to other stats

### 4. Fix Current Tab Swap Functionality
- Swapping should update Current tab immediately
- First swap within a rotation = 2 minutes each player
- Subsequent swaps = 1 minute increments
- Track multiple players with partial minutes (e.g., 3 full @ 4min, 4 half @ 2min)

### 5. Edit Rotations - Time Customization
- Allow changing individual player minutes
- Support >5 players per rotation (injury scenarios)
- Example: 2 players @ 2min, 4 players @ 4min

### 6. Edit Attendance - Swap Tracking
- Separate "swaps attended" from "minutes played"
- Edit how many swaps player attended (0-8)
- Distinguish: "present but didn't play" vs "absent"

---

## Technical Analysis

### Current System Limitations

1. **Algorithm**: Only considers normalized play time (totalMinutes / gamesAttended), doesn't look ahead or optimize whole game
2. **Attendance**: Binary present/absent, no partial game tracking
3. **Swaps**: Creates dual rotations for mid-swap subs, but Current tab doesn't reflect swaps immediately
4. **Time Tracking**: Rigid 4-minute or 2-minute rotations, no custom minutes per player
5. **Data Model**: No `swapsAttended` field, conflates attendance with participation

### Key Files to Modify

| File | Changes Needed |
|------|----------------|
| `/src/types/index.ts` | Add `swapsAttended`, `projectedMinutes`, rotation time flexibility |
| `/src/services/rotation.ts` | Complete rewrite of recommendation algorithm |
| `/src/services/game.ts` | Partial attendance, flexible rotation times, swap tracking |
| `/src/services/stats.ts` | Update play time calculations for partial attendance |
| `/src/components/game/GameDay.tsx` | Pre-game roster optimization preview |
| `/src/components/game/RotationSelector.tsx` | Display optimized rotations with visual indicators |
| `/src/components/game/CurrentPlayerCard.tsx` | Fix swap behavior, add misses, update UI on swap |
| `/src/components/game/SwapsOverview.tsx` | Edit swaps attended, custom minutes per player |

---

## Implementation Phases

### Phase 1: Data Model & Type Updates
**Goal**: Establish foundation for all subsequent changes

**Changes**:
1. Update `PlayerStats` interface:
   ```typescript
   interface PlayerStats {
     // ... existing fields
     swapsAttended?: number;      // 0-8 swaps player was present
     missedShots?: number;        // Total missed attempts
   }
   ```

2. Update `Rotation` interface:
   ```typescript
   interface Rotation {
     quarter: Quarter;
     swap: SwapNumber;
     playersOnCourt: string[];    // Player IDs
     minutes: number;             // DEPRECATED: Use playerMinutes instead
     playerMinutes?: Record<string, number>;  // playerId -> minutes mapping
     isSubstitution?: boolean;    // Flag for mid-swap subs
   }
   ```

3. Add new types for optimization:
   ```typescript
   interface PlayerRotationPriority {
     playerId: string;
     playerName: string;
     playerNumber: string;
     priorityScore: number;       // Lower = higher priority
     factors: {
       currentGameMinutes: number;
       historicalNormalizedTime: number;
       gamesAttendedTotal: number;
       swapsAttendedCurrent: number;
     };
     visualIndicator: 'high-priority' | 'medium' | 'low-priority';
     notes: string;               // Reason for priority level
   }

   interface GameRosterOptimization {
     gameId: string;
     rotations: OptimizedRotation[];
     playerSummary: Record<string, {
       totalMinutes: number;
       rotationsPlayed: number[];
       priorityLevel: 'high' | 'medium' | 'low';
       notes: string;
     }>;
     fairnessScore: number;       // 0-100, higher = more fair
   }

   interface OptimizedRotation {
     quarter: Quarter;
     swap: SwapNumber;
     playerIds: string[];
     minutesPerPlayer: Record<string, number>;
     reasoning: string;
   }
   ```

4. Update `Game` interface:
   ```typescript
   interface Game {
     // ... existing fields
     precomputedOptimization?: GameRosterOptimization;  // Stored at game start
   }
   ```

**Migration Strategy**:
- Add new fields as optional
- Provide defaults for existing data
- Backward compatible with existing localStorage

**Testing**:
- Verify existing games load correctly
- Check that new games initialize with new fields

---

### Phase 2: Enhanced Rotation Algorithm
**Goal**: Implement whole-game optimization with multi-factor scoring

**New Algorithm Components**:

1. **Multi-Factor Priority Scoring**:
   ```typescript
   priorityScore =
     (w1 × currentGameMinutes / targetMinutes) +           // Current game fairness
     (w2 × historicalNormalizedTime / avgNormalizedTime) + // Historical fairness
     (w3 × gamesAttended / maxGamesAttended) -             // Attendance penalty
     (w4 × swapsAttendedCurrent / 8)                       // Current game participation

   // Weights (total = 1.0):
   w1 = 0.50  // Current game is most important
   w2 = 0.30  // Historical fairness matters
   w3 = -0.15 // Fewer games attended = higher priority (negative weight)
   w4 = 0.05  // Current swaps attended (tie-breaker)
   ```

2. **Whole-Game Precomputation** (`RotationService.optimizeGameRoster()`):
   - Input: gameId, attendingPlayerIds
   - Process:
     a. Calculate target minutes per player (32 total / numPlayers)
     b. Initialize all 8 rotations as empty
     c. For each rotation (1-8):
        - Calculate priority scores for all players
        - Select top 5 with lowest scores
        - Assign 4 minutes to each
        - Update running minutes totals
     d. Generate fairness report showing:
        - Minutes per player (sorted)
        - Standard deviation of minutes
        - Players needing more/less time (visual indicators)
   - Output: `GameRosterOptimization` object

3. **Visual Priority Indicators**:
   - **High Priority** (Red/Orange): >20% below target minutes
   - **Medium Priority** (Yellow): Within ±20% of target
   - **Low Priority** (Green): >20% above target minutes
   - Applied to player cards in rotation selector and preview

4. **New Service Methods**:
   ```typescript
   // rotation.ts
   class RotationService {
     static optimizeGameRoster(
       gameId: string,
       attendingPlayerIds: string[]
     ): GameRosterOptimization;

     static calculatePlayerPriority(
       playerId: string,
       gameContext: {
         currentGameMinutes: number;
         targetMinutes: number;
         allGames: Game[];
         currentGameId: string;
       }
     ): PlayerRotationPriority;

     static visualizePriorityLevel(priorityScore: number): string;

     static recommendPlayersWithPriority(
       gameId: string,
       currentRotation: number,
       excludePlayerIds: string[]
     ): PlayerRotationPriority[];
   }
   ```

**UI Changes**:
- New "Optimize Game" button in GameSetup
- Preview modal showing:
  - Table: 8 rotations × player assignments
  - Player summary with total minutes and priority colors
  - Fairness score indicator
  - Notes about key rotations (e.g., "Rotation 3: Balancing Player A's low time")
- Allow manual adjustments to optimization before starting game

**Testing**:
- Unit tests for priority scoring
- Test with varying player counts (6, 8, 10, 12 players)
- Test with historical data (players with different game counts)
- Edge case: New player with 0 games attended

---

### Phase 3: Pre-Game Setup & Partial Attendance
**Goal**: Support flexible attendance and mid-game roster changes

**Changes**:

1. **Start Game with All Players**:
   - `GameService.startGame()` modification:
     ```typescript
     static startGame(gameId: string): void {
       const allPlayers = PlayerService.getPlayers();
       const game = this.getGame(gameId);

       // Assume all players attending initially
       game.attendance = allPlayers.map(p => p.id);

       // Initialize swaps attended for all players
       game.stats = {};
       allPlayers.forEach(player => {
         game.stats[player.id] = {
           ...defaultStats,
           swapsAttended: 8  // Assume full attendance initially
         };
       });

       // Start at Q1S1
       game.status = 'in-progress';
       game.currentQuarter = 1;
       game.currentSwap = 1;

       // Trigger optimization
       const optimization = RotationService.optimizeGameRoster(
         gameId,
         game.attendance
       );
       game.precomputedOptimization = optimization;

       this.saveGame(game);
     }
     ```

2. **Pre-First-Swap Attendance Editor**:
   - New component: `PreGameRosterAdjustment.tsx`
   - Shows before Q1S1 rotation is set
   - Displays:
     - All players with checkboxes
     - Optimized rotation preview
     - "Recalculate" button if attendance changes
   - Removes player from attendance → sets `swapsAttended = 0`

3. **Mid-Game Attendance Changes**:
   - Modify `GameService.setAttendance()`:
     ```typescript
     static setAttendance(gameId: string, playerIds: string[]): void {
       const game = this.getGame(gameId);
       const currentRotation = this.getCurrentRotationNumber(game);

       // Track partial attendance
       playerIds.forEach(pid => {
         if (!game.attendance.includes(pid)) {
           // Player being added mid-game
           game.stats[pid] = game.stats[pid] || defaultStats;
           game.stats[pid].swapsAttended = 8 - currentRotation + 1;
         }
       });

       // Players removed mid-game
       game.attendance.forEach(pid => {
         if (!playerIds.includes(pid) && game.stats[pid]) {
           game.stats[pid].swapsAttended = currentRotation - 1;
         }
       });

       game.attendance = playerIds;
       this.saveGame(game);
     }
     ```

4. **Partial Attendance in Algorithm**:
   - Update priority calculation:
     ```typescript
     const attendanceRatio = swapsAttended / 8;  // 0.0 to 1.0
     const adjustedTargetMinutes = targetMinutes * attendanceRatio;

     // Player who attended 4/8 swaps should target ~16 minutes, not 32
     ```

5. **Stats Calculation Update**:
   - Modify `StatsService.getPlayerSeasonStats()`:
     ```typescript
     // When calculating normalized play time
     const effectiveGamesAttended = games.reduce((sum, game) => {
       const swapsAttended = game.stats[playerId]?.swapsAttended || 8;
       return sum + (swapsAttended / 8);  // 4/8 swaps = 0.5 games
     }, 0);

     normalizedPlayTime = totalMinutes / effectiveGamesAttended;
     ```

**UI Changes**:
- GameSetup: Keep existing attendance selector, but update to show "All players will be marked present initially. You can adjust before first rotation."
- GameDay (before Q1S1): Show "Adjust Attendance" banner
- SwapsOverview: Display swaps attended as "X/8" with edit capability

**Testing**:
- Start game → all players marked attending
- Remove player before Q1S1 → swapsAttended = 0
- Remove player after Q2S1 → swapsAttended = 3
- Add player after Q3S2 → swapsAttended = 2
- Verify normalized play time calculations

---

### Phase 4: Current Tab Improvements
**Goal**: Fix swap functionality and add missed shots tracking

**Changes**:

1. **Add Misses Counter**:
   - Update `CurrentPlayerCard.tsx`:
     ```tsx
     // Add new stat button
     <button onClick={() => handleStatUpdate('missedShots', 1)}>
       Miss
     </button>

     // Display total misses
     <div>Misses: {playerStats.missedShots || 0}</div>
     ```

2. **Fix Swap Functionality**:
   - Current issue: `substitutePlayer()` creates dual rotations but doesn't update Current tab
   - New approach: Track swap state within current rotation

   - Update `GameService.substitutePlayer()`:
     ```typescript
     static substitutePlayer(
       gameId: string,
       playerOutId: string,
       playerInId: string
     ): void {
       const game = this.getGame(gameId);
       const { currentQuarter, currentSwap } = game;

       // Find existing rotations for current quarter/swap
       const currentRotations = game.rotations.filter(
         r => r.quarter === currentQuarter && r.swap === currentSwap
       );

       if (currentRotations.length === 0) {
         throw new Error('No rotation set for current quarter/swap');
       }

       // Determine minutes for this swap
       const hasExistingSubstitution = currentRotations.some(r => r.isSubstitution);
       const minutesPerPlayer = hasExistingSubstitution ? 1 : 2;

       // Create substitution rotation
       const lastRotation = currentRotations[currentRotations.length - 1];
       const newPlayersOnCourt = lastRotation.playersOnCourt
         .filter(id => id !== playerOutId)
         .concat(playerInId);

       const newRotation: Rotation = {
         quarter: currentQuarter,
         swap: currentSwap,
         playersOnCourt: newPlayersOnCourt,
         minutes: minutesPerPlayer,  // DEPRECATED
         playerMinutes: {
           ...Object.fromEntries(
             lastRotation.playersOnCourt
               .filter(id => id !== playerOutId)
               .map(id => [id, minutesPerPlayer])
           ),
           [playerInId]: minutesPerPlayer
         },
         isSubstitution: true
       };

       // Adjust previous rotation minutes
       if (hasExistingSubstitution) {
         // Reduce last rotation players by 1 minute
         const lastRot = currentRotations[currentRotations.length - 1];
         lastRot.playerMinutes = Object.fromEntries(
           Object.entries(lastRot.playerMinutes || {}).map(([pid, min]) =>
             [pid, (min as number) - 1]
           )
         );
       } else {
         // Reduce from 4 to 2 minutes
         const firstRot = currentRotations[0];
         firstRot.playerMinutes = Object.fromEntries(
           firstRot.playersOnCourt.map(pid => [pid, 2])
         );
       }

       game.rotations.push(newRotation);
       this.saveGame(game);
     }
     ```

   - Update `CurrentPlayerCard.tsx` to refetch on swap:
     ```tsx
     const handleSwapPlayer = (playerInId: string) => {
       GameService.substitutePlayer(gameId, player.id, playerInId);
       onUpdate();  // Trigger parent refresh
       setShowSwapDialog(false);
     };
     ```

   - Update `GameDay.tsx`:
     ```tsx
     const [refreshKey, setRefreshKey] = useState(0);

     const handlePlayerUpdate = () => {
       setRefreshKey(prev => prev + 1);
     };

     // Pass to CurrentPlayerCard
     <CurrentPlayerCard onUpdate={handlePlayerUpdate} />
     ```

3. **Display Current Players After Swap**:
   - Update `GameDay.tsx` Current tab logic:
     ```tsx
     // Get LATEST rotation for current quarter/swap
     const currentRotations = game.rotations.filter(
       r => r.quarter === game.currentQuarter && r.swap === game.currentSwap
     );
     const latestRotation = currentRotations[currentRotations.length - 1];
     const currentPlayerIds = latestRotation?.playersOnCourt || [];
     ```

**UI Changes**:
- Current tab: Add "Misses" stat display
- Swap dialog: Show feedback "Swapped! [Player A] out, [Player B] in (2 min)"
- Current tab: Immediately show new player after swap

**Testing**:
- Set rotation Q1S1 with 5 players
- Swap player A → B (each gets 2 min)
- Verify Current tab shows B instead of A
- Swap player C → D (each gets 1 min)
- Verify all 4 players shown with correct minutes
- Record missed shot → verify counter increments

---

### Phase 5: Edit Rotations Enhancement
**Goal**: Allow custom minutes per player and >5 players per rotation

**Changes**:

1. **SwapsOverview Edit Mode Enhancement**:
   - Currently: Toggle players in/out (all get 4 min or 0 min)
   - New: Click player cell → input field for custom minutes

   - Update `SwapsOverview.tsx`:
     ```tsx
     const [editingCell, setEditingCell] = useState<{
       playerId: string,
       rotation: number
     } | null>(null);

     const handleCellClick = (playerId: string, rotation: number) => {
       if (isEditing) {
         setEditingCell({ playerId, rotation });
       }
     };

     const handleMinutesChange = (minutes: number) => {
       const { playerId, rotation } = editingCell!;

       // Update rotation with custom minutes
       GameService.updatePlayerMinutesInRotation(
         gameId,
         rotation,
         playerId,
         minutes
       );

       setEditingCell(null);
     };
     ```

2. **New Service Method**:
   ```typescript
   // game.ts
   static updatePlayerMinutesInRotation(
     gameId: string,
     rotationNumber: number,
     playerId: string,
     minutes: number
   ): void {
     const game = this.getGame(gameId);
     const { quarter, swap } = this.getQuarterSwapFromRotation(rotationNumber);

     // Find rotation(s) for this quarter/swap
     const rotations = game.rotations.filter(
       r => r.quarter === quarter && r.swap === swap
     );

     if (rotations.length === 0) {
       // Create new rotation
       game.rotations.push({
         quarter,
         swap,
         playersOnCourt: [playerId],
         minutes: 4,  // DEPRECATED
         playerMinutes: { [playerId]: minutes }
       });
     } else {
       // Update existing rotation
       const rotation = rotations[0];

       if (minutes === 0) {
         // Remove player
         rotation.playersOnCourt = rotation.playersOnCourt.filter(
           id => id !== playerId
         );
         delete rotation.playerMinutes?.[playerId];
       } else {
         // Add or update player
         if (!rotation.playersOnCourt.includes(playerId)) {
           rotation.playersOnCourt.push(playerId);
         }
         rotation.playerMinutes = rotation.playerMinutes || {};
         rotation.playerMinutes[playerId] = minutes;
       }
     }

     this.saveGame(game);
   }
   ```

3. **Support >5 Players**:
   - Remove validation that limits to exactly 5 players
   - Update `addRotation()` to accept 1-N players
   - UI shows warning if >5 players (not error)

4. **Minutes Input Component**:
   ```tsx
   <input
     type="number"
     min={0}
     max={8}
     step={0.5}
     value={minutes}
     onChange={(e) => handleMinutesChange(parseFloat(e.target.value))}
     className="w-16 text-center border rounded"
   />
   ```

**UI Changes**:
- SwapsOverview grid: Click cell → minutes input appears
- Show total minutes per rotation (e.g., "18 / 32 min used")
- Color code cells: Green (standard 4 min), Yellow (custom time), Red (>5 players warning)
- Add "Reset to 4 min" button for each rotation

**Testing**:
- Edit rotation: Set 2 players @ 2 min, 4 players @ 4 min = 20 min total
- Edit rotation: Set 6 players (2 @ 3 min, 4 @ 5 min) = 32 min total
- Verify play time stats update correctly
- Edge case: Set player to 0 min → removed from rotation

---

### Phase 6: Edit Attendance Enhancement
**Goal**: Separate swaps attended from minutes played

**Changes**:

1. **SwapsOverview Attendance Modal Enhancement**:
   - Currently: Checkboxes for attending/not attending
   - New: Input field for swaps attended (0-8)

   - Update `SwapsOverview.tsx`:
     ```tsx
     const [editingSwapsAttended, setEditingSwapsAttended] = useState<
       Record<string, number>
     >({});

     const handleSwapsAttendedChange = (playerId: string, swaps: number) => {
       setEditingSwapsAttended(prev => ({
         ...prev,
         [playerId]: swaps
       }));
     };

     const saveAttendanceChanges = () => {
       Object.entries(editingSwapsAttended).forEach(([playerId, swaps]) => {
         GameService.updatePlayerSwapsAttended(gameId, playerId, swaps);
       });

       // Update attendance array based on swaps > 0
       const newAttendance = Object.entries(editingSwapsAttended)
         .filter(([_, swaps]) => swaps > 0)
         .map(([playerId]) => playerId);

       GameService.setAttendance(gameId, newAttendance);
       setShowEditAttendance(false);
     };
     ```

2. **New Service Method**:
   ```typescript
   // game.ts
   static updatePlayerSwapsAttended(
     gameId: string,
     playerId: string,
     swapsAttended: number
   ): void {
     const game = this.getGame(gameId);

     if (!game.stats[playerId]) {
       game.stats[playerId] = { ...defaultStats };
     }

     game.stats[playerId].swapsAttended = swapsAttended;
     this.saveGame(game);
   }
   ```

3. **Attendance Modal UI**:
   ```tsx
   <div className="space-y-4">
     <h3>Edit Player Attendance</h3>
     {allPlayers.map(player => {
       const swapsAttended = game.stats[player.id]?.swapsAttended || 0;
       const minutesPlayed = StatsService.calculatePlayTime(gameId, player.id);

       return (
         <div key={player.id} className="flex items-center gap-4">
           <span className="w-32">{player.name}</span>

           <div>
             <label>Swaps Attended:</label>
             <input
               type="number"
               min={0}
               max={8}
               value={swapsAttended}
               onChange={(e) => handleSwapsAttendedChange(
                 player.id,
                 parseInt(e.target.value)
               )}
               className="w-16 ml-2"
             />
             <span className="text-sm text-gray-500 ml-2">/ 8</span>
           </div>

           <div className="text-sm text-gray-600">
             {minutesPlayed} min played
           </div>

           {swapsAttended > 0 && minutesPlayed === 0 && (
             <span className="text-orange-600 text-sm">
               Present but didn't play
             </span>
           )}

           {swapsAttended === 0 && minutesPlayed > 0 && (
             <span className="text-red-600 text-sm">
               ⚠️ Played but marked absent
             </span>
           )}
         </div>
       );
     })}
   </div>
   ```

4. **Validation**:
   - If swapsAttended > 0 but not in attendance array → add to attendance
   - If swapsAttended = 0 but in attendance array → remove from attendance
   - Warning if minutesPlayed > (swapsAttended × 4) → "Player played more minutes than swaps attended allows"

**UI Changes**:
- SwapsOverview attendance modal: Show swaps attended input for each player
- Display "X/8 swaps" with edit icon
- Show minutes played alongside swaps attended
- Visual indicators for inconsistencies

**Testing**:
- Set player to 4/8 swaps, 16 minutes played → valid
- Set player to 0/8 swaps, 0 minutes → absent player
- Set player to 8/8 swaps, 0 minutes → present but didn't play
- Set player to 4/8 swaps, 24 minutes → warning (impossible)

---

## Phase Execution Order

### Recommended Sequence:

1. **Phase 1** → Foundation (types, data model)
2. **Phase 3** → Partial attendance (needed for algorithm)
3. **Phase 2** → Enhanced algorithm (uses Phase 1 & 3)
4. **Phase 4** → Current tab fixes (independent, user-facing)
5. **Phase 5** → Edit rotations (builds on Phase 1)
6. **Phase 6** → Edit attendance (final polish, uses all previous phases)

### Alternative Sequence (User-Facing First):

1. **Phase 1** → Foundation
2. **Phase 4** → Quick wins (misses counter, swap fix)
3. **Phase 3** → Partial attendance
4. **Phase 2** → Algorithm
5. **Phase 5** → Edit rotations
6. **Phase 6** → Edit attendance

---

## Testing Strategy

### Unit Tests (Vitest)
- `rotation.ts`: Priority scoring, optimization algorithm
- `game.ts`: Partial attendance tracking, flexible rotations
- `stats.ts`: Effective games attended calculation

### Integration Tests
- Complete game flow: Start → Set rotations → Swaps → Complete
- Mid-game attendance change: Remove player after Q2S1
- Custom rotation times: 6 players with varying minutes

### Manual Testing Scenarios

1. **Scenario: New Season Start**
   - All players have 0 games attended
   - Should distribute evenly in first game

2. **Scenario: Historical Imbalance**
   - Player A: 3 games, 60 min total (20 min/game)
   - Player B: 3 games, 90 min total (30 min/game)
   - Player C: 1 game, 20 min total (20 min/game)
   - Game 4: All attend
   - Expected: C gets most time, then A, then B

3. **Scenario: Late Arrival**
   - Start game with 10 players
   - After Q2S1, Player X arrives
   - Set swapsAttended = 4
   - Remaining rotations should prioritize Player X

4. **Scenario: Injury Mid-Game**
   - Q3S1: Player Y injured, needs to sit
   - Set swapsAttended = 5 (attended Q1-Q2 + Q3S1)
   - Edit rotation Q3S1: Y = 1 min, others adjust
   - Verify stats reflect partial swap

---

## Migration & Backward Compatibility

### Existing Data Handling

1. **Games without `swapsAttended`**:
   - Default to 8 if player in attendance
   - Default to 0 if player not in attendance

2. **Rotations without `playerMinutes`**:
   - Derive from `minutes` field: all players get equal time
   - `playerMinutes = { [p1]: 4, [p2]: 4, ... }`

3. **Stats without `missedShots`**:
   - Default to 0
   - Can be inferred from attempts - made (future enhancement)

### Storage Version Update
```typescript
interface AppData {
  version: 2;  // Increment from 1
  players: Player[];
  games: Game[];
  migrations?: {
    v2Applied?: boolean;
  };
}
```

---

## Performance Considerations

1. **Whole-Game Optimization**:
   - Runs once at game start (or when attendance changes)
   - Cached in `game.precomputedOptimization`
   - O(8 rotations × N players × log N) = ~O(N log N)
   - Acceptable for N ≤ 20 players

2. **Real-Time Priority Calculation**:
   - Runs on each rotation recommendation request
   - Needs to query all games for historical data
   - Optimization: Cache season stats, invalidate on game completion

3. **UI Refresh on Swap**:
   - Currently: Full game refetch
   - Optimization: Granular state updates (React Context or Zustand)

---

## UI/UX Enhancements

### Visual Design

1. **Priority Indicators**:
   - High Priority: Red badge with "🔥 Needs Time"
   - Medium: Yellow badge with "⚖️ Balanced"
   - Low Priority: Green badge with "✅ Fair Share"

2. **Optimization Preview**:
   - Heatmap: Players (rows) × Rotations (columns)
   - Cell colors: Player's priority level
   - Hover: Show reasoning tooltip

3. **Swaps Attended Display**:
   - Progress bar: 4/8 swaps = 50% filled
   - Color: Green (≥6), Yellow (4-5), Red (≤3)

### User Feedback

1. **Game Start**:
   - "✨ Optimized rotation generated! X players will play ~Y minutes each."

2. **Mid-Game Adjustment**:
   - "Player A removed after Q2S1. Attended 3/8 swaps. Remaining rotations adjusted."

3. **Manual Override**:
   - "⚠️ Manual rotation differs from optimization. Player B may have less time."

---

## Open Questions / Future Enhancements

1. **Position-Based Optimization**:
   - Should algorithm consider player positions?
   - E.g., Always have 1 center on court

2. **Skill-Based Balancing**:
   - Track player skill levels
   - Distribute skilled players evenly across rotations

3. **Real-Time Adjustments**:
   - If Player A plays 0 min in Q1-Q2, auto-prioritize in Q3-Q4
   - Dynamic re-optimization mid-game

4. **Multi-Game Lookahead**:
   - If team has 2 games this week, optimize across both
   - Player with low time in Game 1 → guaranteed high time in Game 2

5. **Export Optimization Report**:
   - PDF export of rotation plan
   - Share with parents: "Your child will play approximately X minutes"

---

## Success Criteria

### Phase 1
- [x] Types updated with no TypeScript errors
- [x] Existing games load and display correctly
- [x] New games initialize with new fields

### Phase 2
- [x] Optimization algorithm produces balanced rotations
- [x] Visual indicators display correctly
- [x] Manual adjustments possible after optimization

### Phase 3
- [x] Games start with all players attending
- [x] Partial attendance tracked accurately
- [x] Mid-game attendance changes work correctly

### Phase 4
- [x] Misses counter displays on Current tab
- [x] Swapping player updates Current tab immediately
- [x] Multiple swaps within rotation track correctly

### Phase 5
- [x] Custom minutes per player editable
- [x] >5 players per rotation supported
- [x] Play time stats reflect custom minutes

### Phase 6
- [x] Swaps attended editable independently
- [x] Inconsistencies highlighted
- [x] Stats calculations use effective attendance

---

## Conclusion

This plan provides a comprehensive roadmap for enhancing the Basketball Team Manager app with:
- Fairer player rotation optimization
- Flexible attendance tracking
- Improved game management tools
- Better coach and player experience

Estimated total implementation time: 6-8 phases × 1-2 hours each = **8-16 hours of development**

Each phase can be implemented, tested, and deployed independently, allowing for iterative delivery.
