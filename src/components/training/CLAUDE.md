# Training Components Guide

## BasketballCourt.tsx
SVG basketball court diagram with animated player positions.

**Props**: `currentStep: number`, `play: CourtPlay`

**Interfaces** (exported):
```typescript
interface PlayerPosition {
  x: number;      // 0-100 percentage
  y: number;      // 0-100 percentage
  label: string;  // Player number (1-5)
  hasBall?: boolean;
}

interface DefenderPosition {
  x: number;      // 0-100 percentage
  y: number;      // 0-100 percentage
}

interface CourtPlay {
  name: string;
  description: string;
  steps: {
    positions: PlayerPosition[];
    defenders?: DefenderPosition[];
    description: string;
    movements?: {
      from: number;  // Player index
      to: number;    // Player index
      type: 'pass' | 'dribble' | 'cut' | 'screen';
      path?: { x: number; y: number }[];  // Curved path points
    }[];
  }[];
}
```

**Coordinate System**:
- SVG viewBox: `0 0 500 470`
- Conversion: `svgX = (percentage / 100) * 480 + 10`
- Y axis: 0 = half court (top), 100 = baseline (bottom)
- Basket at approximately y=92%

**5-Out Spacing Positions** (proper 3pt line):
- Point guard (1): x=50, y=32
- Left wing (2): x=22, y=48
- Right wing (3): x=78, y=48
- Left corner (4): x=12, y=70
- Right corner (5): x=88, y=70

**Visual Elements**:
- Players: Blue circles (#3B82F6), orange if has ball (#F59E0B)
- Defenders: Red X markers (#DC2626)
- Movements: Green dashed (pass), red solid (cut), orange (dribble), purple (screen)
- Ghost positions: Faded previous step locations
- Ball indicator: Orange bouncing circle above ball handler

## Training.tsx (in /src/pages/)
Contains the 6 predefined 5-out plays:
1. 5-Out Basic Spacing
2. Pass and Cut
3. Dribble Drive and Kick
4. Screen Away
5. Basket Cut and Fill
6. Dribble Handoff (DHO)

Each play has multiple steps with player positions, defender positions, and movement arrows.

**Auto-play**: 3 seconds per step interval.
