# Claude Code Memory - Basketball Team Manager

## Session Date: 2026-01-26
## Branch: `claude/optimize-player-rotation-6UQ7Y`

---

## Current Status: PLANNING COMPLETE ✅

### What We Accomplished

1. ✅ **Explored codebase** to understand current rotation algorithm and game management
2. ✅ **Created comprehensive implementation plan** (`IMPLEMENTATION_PLAN.md`)
3. ✅ **Organized work into 6 logical phases**

### Key Findings from Codebase Exploration

**Current Rotation Algorithm** (`/src/services/rotation.ts`):
- Uses simple normalized play time: `totalMinutes / gamesAttended`
- Only considers single metric for recommendations
- No whole-game optimization
- Sorts by lowest normalized time first

**Current Limitations Identified**:
1. No historical game attendance weighting
2. Binary attendance (present/absent only, no partial tracking)
3. Rigid 4-minute or 2-minute rotations
4. Current tab doesn't update when swapping players
5. No custom minutes per player in rotations
6. Swaps attended not separated from minutes played

---

## Requirements Summary (From User)

### 1. Enhanced Rotation Algorithm
- Equal playing time within current game
- Factor in historical playing time across all games
- Precompute whole game roster for optimization
- Visual indicators (colors) for players needing more/less time
- Tie-breaker: Fewer games attended = higher priority

### 2. Pre-Game Setup & Partial Attendance
- Start game assuming everyone present
- Allow attendance edits before first swap
- Track partial attendance (X/8 swaps attended)
- Mid-game attendance changes (late arrivals/early departures)
- Count partial attendance in play time calculations

### 3. Add Misses Counter
- Display on Current tab next to other stats

### 4. Fix Current Tab Swap Functionality
- Swapping should update Current tab immediately
- First swap = 2 min each, subsequent = 1 min increments
- Support multiple partial-minute players

### 5. Edit Rotations - Time Customization
- Change individual player minutes
- Support >5 players (injury scenarios)
- Example: 2 @ 2min, 4 @ 4min

### 6. Edit Attendance - Swap Tracking
- Edit swaps attended separately from play time
- Distinguish "present but didn't play" vs "absent"

---

## Implementation Phases (Recommended Order)

### Phase 1: Data Model & Type Updates
**Status**: NOT STARTED
**Files**: `/src/types/index.ts`
**Goal**: Add `swapsAttended`, `playerMinutes`, optimization types
**Estimated Effort**: 1-2 hours

### Phase 2: Enhanced Rotation Algorithm
**Status**: NOT STARTED
**Files**: `/src/services/rotation.ts`, `/src/components/game/RotationSelector.tsx`
**Goal**: Multi-factor scoring, whole-game optimization, visual indicators
**Estimated Effort**: 2-3 hours

### Phase 3: Pre-Game Setup & Partial Attendance
**Status**: NOT STARTED
**Files**: `/src/services/game.ts`, `/src/services/stats.ts`, `GameSetup.tsx`
**Goal**: Start with all players, track partial attendance, mid-game changes
**Estimated Effort**: 2 hours

### Phase 4: Current Tab Improvements
**Status**: NOT STARTED
**Files**: `/src/components/game/CurrentPlayerCard.tsx`, `GameDay.tsx`
**Goal**: Add misses counter, fix swap functionality, immediate UI updates
**Estimated Effort**: 1-2 hours

### Phase 5: Edit Rotations Enhancement
**Status**: NOT STARTED
**Files**: `/src/components/game/SwapsOverview.tsx`, `/src/services/game.ts`
**Goal**: Custom minutes per player, >5 players support
**Estimated Effort**: 1-2 hours

### Phase 6: Edit Attendance Enhancement
**Status**: NOT STARTED
**Files**: `/src/components/game/SwapsOverview.tsx`, `/src/services/game.ts`
**Goal**: Edit swaps attended, separate from play time
**Estimated Effort**: 1-2 hours

**Total Estimated Effort**: 8-14 hours

---

## Key Technical Decisions Made

### Data Model Changes

1. **PlayerStats Interface**:
   ```typescript
   swapsAttended?: number;    // 0-8 swaps present
   missedShots?: number;      // Total missed attempts
   ```

2. **Rotation Interface**:
   ```typescript
   playerMinutes?: Record<string, number>;  // playerId -> minutes
   isSubstitution?: boolean;                // Mid-swap flag
   ```

3. **New Optimization Types**:
   - `PlayerRotationPriority`: Priority scoring with factors
   - `GameRosterOptimization`: Whole-game precomputed plan
   - `OptimizedRotation`: Per-rotation player assignments

### Algorithm Design

**Multi-Factor Priority Score**:
```
priorityScore =
  0.50 × (currentGameMinutes / targetMinutes) +     // Current game fairness
  0.30 × (historicalNormalized / avgNormalized) +  // Historical fairness
  -0.15 × (gamesAttended / maxGamesAttended) +     // Attendance bonus
  0.05 × (swapsAttendedCurrent / 8)                // Current participation
```

**Visual Indicators**:
- High Priority (Red/Orange): >20% below target
- Medium (Yellow): Within ±20% of target
- Low Priority (Green): >20% above target

### Migration Strategy

- All new fields optional for backward compatibility
- Default swapsAttended = 8 if in attendance, 0 otherwise
- Default playerMinutes derived from existing `minutes` field
- No data loss for existing games

---

## Next Steps (For Next Session)

### Option A: Start with Quick Wins (User-Facing)
```bash
# Work on Phase 4 first
# - Add misses counter (simple)
# - Fix swap functionality (high impact)
# Then tackle Phase 1 → Phase 3 → Phase 2 → Phase 5 → Phase 6
```

### Option B: Build Foundation First (Recommended)
```bash
# Work on phases in order: 1 → 3 → 2 → 4 → 5 → 6
# More logical dependency flow
# Algorithm (Phase 2) uses partial attendance (Phase 3)
```

### Starting Command for Next Session
```bash
# User will say: "Start Phase 1" or "Start Phase 4" or "Continue"
# Then we'll implement that specific phase
```

---

## Important Files Reference

### Core Services
- `/src/services/rotation.ts` - Rotation recommendations (126 lines)
- `/src/services/game.ts` - Game CRUD, attendance, rotations (211 lines)
- `/src/services/stats.ts` - Play time calculations (178 lines)

### Key Components
- `/src/components/game/GameDay.tsx` - Main game container (408 lines)
- `/src/components/game/RotationSelector.tsx` - Player selection UI (210 lines)
- `/src/components/game/CurrentPlayerCard.tsx` - On-court player card (299 lines)
- `/src/components/game/SwapsOverview.tsx` - Grid view of swaps (538 lines)

### Types
- `/src/types/index.ts` - All TypeScript interfaces (72 lines)

### Project Docs
- `/CLAUDE.md` - Project overview and tech stack
- `/IMPLEMENTATION_PLAN.md` - This comprehensive plan
- `/src/components/game/CLAUDE.md` - Game component docs
- `/src/components/training/CLAUDE.md` - Training component docs
- `/src/services/CLAUDE.md` - Service layer details

---

## Testing Strategy Notes

### Unit Tests Needed
- Priority score calculation
- Whole-game optimization algorithm
- Partial attendance calculations
- Effective games attended

### Manual Test Scenarios
1. **New Season**: All players 0 games → should distribute evenly
2. **Historical Imbalance**: Player A (60 min/3 games), Player B (90 min/3 games), Player C (20 min/1 game) → Priority: C > A > B
3. **Late Arrival**: Player joins after Q2S1 → swapsAttended = 4
4. **Injury Mid-Game**: Player sits after Q3S1 → swapsAttended = 5, custom minutes

---

## Open Questions for User

1. **Phase Order**: Quick wins first (Phase 4) or foundation first (Phase 1)?
2. **Testing Approach**: Write tests alongside implementation or after completion?
3. **Feature Flags**: Should we add toggle for new algorithm vs old algorithm during transition?
4. **Data Export**: Should optimization preview be exportable (PDF/CSV)?

---

## Git Status

- **Current Branch**: `claude/optimize-player-rotation-6UQ7Y`
- **Status**: Clean (plan files added, ready to implement)
- **Main Branch**: Not specified (will create PR when complete)

---

## Token Budget Notes

User mentioned limited tokens remaining. Plan is structured so they can:
- Work on phases incrementally across multiple sessions
- Pick up easily with this memory file
- Skip to any phase if priorities change

---

## Success Metrics

When all phases complete:
- ✅ Rotations optimized across full game, not just per-swap
- ✅ Historical play time factored into recommendations
- ✅ Partial attendance tracked (late arrivals, early departures)
- ✅ Current tab updates immediately on swap
- ✅ Misses counter visible on Current tab
- ✅ Custom minutes per player editable
- ✅ Swaps attended independent from play time
- ✅ Visual indicators show rotation priorities
- ✅ All existing functionality preserved (backward compatible)

---

## Additional Notes

### Branding Reminders
- Team: **Bucket Ducks**
- Colors: Blue-600 primary, orange accents
- Logo: `/public/team-logo.svg`

### Tech Stack
- Vite + React 19 + TypeScript
- Tailwind CSS v3.4
- React Router DOM v7.13
- localStorage (no backend)
- Vitest for testing

### Commands
```bash
npm run dev      # Dev server
npm run build    # Production build
npm run test     # Run tests
```

---

## Last Updated: 2026-01-26
## Next Action: **Await user instruction on which phase to start**
