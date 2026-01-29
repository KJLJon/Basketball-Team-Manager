# Game Components

**GameDay.tsx**: Main component, 4 tabs (Rotation/Current/Stats/Swaps). handleNextSwap advances game, handleSwapPlayer does mid-rotation sub (2 min each)

**RotationSelector.tsx**: Select 5 players with AI recommendations (RotationService.recommendPlayers). "Use All" button, saves via GameService.addRotation

**CurrentPlayerCard.tsx**: On-court player with stat buttons (Steal/Rebound/Made/Miss), swap dialog with recommendations

**SwapsOverview.tsx**: Grid view (players × swaps). Edit rotations, attendance, minutes (0-8). Shows X/8 swaps attended

**RotationHistory.tsx**: Read-only view for completed games

**EditableStatRow.tsx**: +/- buttons for stats

**StatButtonWithDropdown.tsx**: Point type dropdown (1pt/2pt/3pt)
