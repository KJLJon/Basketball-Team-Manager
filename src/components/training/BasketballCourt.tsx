import React from 'react';

export interface PlayerPosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  label: string;
  hasBall?: boolean;
}

export interface DefenderPosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface CourtPlay {
  name: string;
  description: string;
  steps: {
    positions: PlayerPosition[];
    defenders?: DefenderPosition[];
    description: string;
    movements?: {
      from: number; // player index
      to: number; // player index
      path?: { x: number; y: number }[]; // optional curved path
      type: 'pass' | 'dribble' | 'cut' | 'screen';
    }[];
  }[];
}

interface BasketballCourtProps {
  currentStep: number;
  play: CourtPlay;
}

export const BasketballCourt: React.FC<BasketballCourtProps> = ({ currentStep, play }) => {
  const step = play.steps[currentStep];
  const prevStep = currentStep > 0 ? play.steps[currentStep - 1] : null;

  // Helper to get player color based on if they have the ball
  const getPlayerColor = (player: PlayerPosition) => {
    return player.hasBall ? '#F59E0B' : '#3B82F6'; // Orange for ball handler, blue for others
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <svg viewBox="0 0 500 470" className="w-full h-auto" style={{ maxHeight: '70vh' }}>
        {/* Basketball Court */}
        <defs>
          <pattern id="wood" patternUnits="userSpaceOnUse" width="500" height="470">
            <rect width="500" height="470" fill="#D4A574"/>
          </pattern>

          {/* Arrow marker for movements */}
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#EF4444" />
          </marker>

          <marker id="passArrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#10B981" />
          </marker>
        </defs>

        {/* Court background */}
        <rect width="500" height="470" fill="url(#wood)" />

        {/* Court outline */}
        <rect x="10" y="10" width="480" height="450" fill="none" stroke="#fff" strokeWidth="3"/>

        {/* Half court line (at top) */}
        <line x1="10" y1="110" x2="490" y2="110" stroke="#fff" strokeWidth="2"/>

        {/* Center circle (at half court) */}
        <circle cx="250" cy="110" r="60" fill="none" stroke="#fff" strokeWidth="2"/>

        {/* Three-point line (arc at bottom) */}
        <path d="M 60 460 L 60 360 Q 60 100 250 80 Q 440 100 440 360 L 440 460"
              fill="none" stroke="#fff" strokeWidth="2"/>

        {/* Free throw lane (at bottom) */}
        <rect x="180" y="270" width="140" height="190" fill="none" stroke="#fff" strokeWidth="2"/>

        {/* Free throw circle (at bottom) */}
        <circle cx="250" cy="270" r="60" fill="none" stroke="#fff" strokeWidth="2"/>

        {/* Basket (at bottom) */}
        <circle cx="250" cy="425" r="8" fill="none" stroke="#E63946" strokeWidth="3"/>
        <line x1="250" y1="433" x2="250" y2="460" stroke="#E63946" strokeWidth="2"/>

        {/* Backboard */}
        <line x1="220" y1="425" x2="280" y2="425" stroke="#E63946" strokeWidth="3"/>

        {/* Movement arrows (show before players so players are on top) */}
        {step.movements?.map((movement, idx) => {
          const fromPlayer = prevStep?.positions[movement.from] || step.positions[movement.from];
          const toPlayer = step.positions[movement.to];

          // Convert percentages to SVG coordinates
          const fromX = (fromPlayer.x / 100) * 480 + 10;
          const fromY = (fromPlayer.y / 100) * 450 + 10;
          const toX = (toPlayer.x / 100) * 480 + 10;
          const toY = (toPlayer.y / 100) * 450 + 10;

          const arrowColor = movement.type === 'pass' ? '#10B981' :
                           movement.type === 'cut' ? '#EF4444' :
                           movement.type === 'dribble' ? '#F59E0B' :
                           '#8B5CF6'; // screen

          const markerUrl = movement.type === 'pass' ? 'url(#passArrow)' : 'url(#arrowhead)';

          if (movement.path && movement.path.length > 0) {
            // Curved path
            const pathData = movement.path.map((point, i) => {
              const x = (point.x / 100) * 480 + 10;
              const y = (point.y / 100) * 450 + 10;
              return i === 0 ? `M ${fromX} ${fromY} Q ${x} ${y}` : `${x} ${y}`;
            }).join(' ') + ` ${toX} ${toY}`;

            return (
              <path
                key={`movement-${idx}`}
                d={pathData}
                fill="none"
                stroke={arrowColor}
                strokeWidth="3"
                strokeDasharray={movement.type === 'pass' ? '5,5' : 'none'}
                markerEnd={markerUrl}
                className="animate-draw-path"
              />
            );
          } else {
            // Straight line
            return (
              <line
                key={`movement-${idx}`}
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke={arrowColor}
                strokeWidth="3"
                strokeDasharray={movement.type === 'pass' ? '5,5' : 'none'}
                markerEnd={markerUrl}
                className="animate-draw-line"
              />
            );
          }
        })}

        {/* Ghost positions (previous step) - show where players came from */}
        {prevStep?.positions.map((player, idx) => {
          const currentPlayer = step.positions[idx];
          const isMoving = player.x !== currentPlayer.x || player.y !== currentPlayer.y;

          if (!isMoving) return null;

          const x = (player.x / 100) * 480 + 10;
          const y = (player.y / 100) * 450 + 10;

          return (
            <g key={`ghost-${idx}`} opacity="0.3" className="ghost-fade-out">
              <circle
                cx={x}
                cy={y}
                r="20"
                fill={getPlayerColor(player)}
                stroke="#fff"
                strokeWidth="2"
                strokeDasharray="3,3"
              />
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                fill="#fff"
                fontSize="14"
                fontWeight="bold"
              >
                {player.label}
              </text>
            </g>
          );
        })}

        {/* Defenders (X markers) */}
        {step.defenders?.map((defender, idx) => {
          const x = (defender.x / 100) * 480 + 10;
          const y = (defender.y / 100) * 450 + 10;
          const prevDefender = prevStep?.defenders?.[idx];
          const prevX = prevDefender ? (prevDefender.x / 100) * 480 + 10 : x;
          const prevY = prevDefender ? (prevDefender.y / 100) * 450 + 10 : y;

          return (
            <g
              key={`defender-${idx}`}
              className="player-transition"
              style={{
                '--from-x': `${prevX}px`,
                '--from-y': `${prevY}px`,
                '--to-x': `${x}px`,
                '--to-y': `${y}px`,
              } as React.CSSProperties}
            >
              {/* X marker for defender */}
              <line
                x1={x - 10}
                y1={y - 10}
                x2={x + 10}
                y2={y + 10}
                stroke="#DC2626"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1={x + 10}
                y1={y - 10}
                x2={x - 10}
                y2={y + 10}
                stroke="#DC2626"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* Current Players with smooth transitions */}
        {step.positions.map((player, idx) => {
          const x = (player.x / 100) * 480 + 10;
          const y = (player.y / 100) * 450 + 10;
          const prevPlayer = prevStep?.positions[idx];
          const prevX = prevPlayer ? (prevPlayer.x / 100) * 480 + 10 : x;
          const prevY = prevPlayer ? (prevPlayer.y / 100) * 450 + 10 : y;

          return (
            <g key={`player-${idx}`}>
              {/* Player circle with transition */}
              <circle
                cx={x}
                cy={y}
                r="20"
                fill={getPlayerColor(player)}
                stroke="#fff"
                strokeWidth="2"
                className="player-transition"
                style={{
                  '--from-x': `${prevX}px`,
                  '--from-y': `${prevY}px`,
                  '--to-x': `${x}px`,
                  '--to-y': `${y}px`,
                } as React.CSSProperties}
              />

              {/* Ball indicator */}
              {player.hasBall && (
                <circle
                  cx={x}
                  cy={y - 28}
                  r="6"
                  fill="#FF6B35"
                  stroke="#000"
                  strokeWidth="1"
                  className="animate-bounce-ball player-transition"
                />
              )}

              {/* Player label */}
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                fill="#fff"
                fontSize="14"
                fontWeight="bold"
                className="player-transition"
              >
                {player.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500" style={{ borderTop: '2px dashed' }}></div>
            <span>Pass</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-500"></div>
            <span>Cut</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-amber-500"></div>
            <span>Dribble</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-purple-500"></div>
            <span>Screen</span>
          </div>
        </div>
      </div>
    </div>
  );
};
