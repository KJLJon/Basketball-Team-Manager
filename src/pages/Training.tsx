import React, { useState } from 'react';
import { BasketballCourt, CourtPlay } from '../components/training/BasketballCourt';
import { Button } from '../components/common/Button';

// Define 5-out offense scenarios
// Court is oriented with basket at bottom (y=92%), half court at top (y=22%)
const fiveOutPlays: CourtPlay[] = [
  {
    name: '5-Out Basic Spacing',
    description: 'The foundation of 5-out offense - all players spread around the perimeter creating maximum spacing.',
    steps: [
      {
        positions: [
          { x: 50, y: 45, label: '1', hasBall: true },
          { x: 20, y: 65, label: '2' },
          { x: 80, y: 65, label: '3' },
          { x: 15, y: 82, label: '4' },
          { x: 85, y: 82, label: '5' },
        ],
        description: 'Initial 5-out spacing: Point guard at top of 3-point arc, wings spread at 3-point line, corners at 3-point line. Notice the spacing - everyone is evenly distributed around the perimeter.',
      },
    ],
  },
  {
    name: 'Pass and Cut',
    description: 'The most fundamental action in 5-out offense. Pass to a teammate and cut to the basket.',
    steps: [
      {
        positions: [
          { x: 50, y: 45, label: '1', hasBall: true },
          { x: 20, y: 65, label: '2' },
          { x: 80, y: 65, label: '3' },
          { x: 15, y: 82, label: '4' },
          { x: 85, y: 82, label: '5' },
        ],
        description: 'Step 1: Point guard has the ball at the top of the key.',
      },
      {
        positions: [
          { x: 50, y: 45, label: '1' },
          { x: 20, y: 65, label: '2', hasBall: true },
          { x: 80, y: 65, label: '3' },
          { x: 15, y: 82, label: '4' },
          { x: 85, y: 82, label: '5' },
        ],
        description: 'Step 2: Player 1 passes to Player 2 on the wing.',
        movements: [
          { from: 0, to: 1, type: 'pass' },
        ],
      },
      {
        positions: [
          { x: 40, y: 80, label: '1' },
          { x: 20, y: 75, label: '2', hasBall: true },
          { x: 80, y: 75, label: '3' },
          { x: 15, y: 87, label: '4' },
          { x: 85, y: 87, label: '5' },
        ],
        description: 'Step 3: After passing, Player 1 cuts toward the basket looking for a return pass (give and go).',
        movements: [
          { from: 0, to: 0, type: 'cut' },
        ],
      },
      {
        positions: [
          { x: 15, y: 87, label: '1' },
          { x: 50, y: 55, label: '2', hasBall: true },
          { x: 80, y: 75, label: '3' },
          { x: 35, y: 65, label: '4' },
          { x: 85, y: 87, label: '5' },
        ],
        description: 'Step 4: If cut isn\'t open, Player 1 fills the corner. Player 4 replaces at the top. Player 2 moves to point position. Spacing is maintained!',
        movements: [
          { from: 0, to: 0, type: 'cut' },
          { from: 3, to: 3, type: 'cut' },
          { from: 1, to: 1, type: 'cut' },
        ],
      },
    ],
  },
  {
    name: 'Dribble Drive and Kick',
    description: 'Drive to the basket to collapse the defense, then kick out to open shooters.',
    steps: [
      {
        positions: [
          { x: 50, y: 45, label: '1', hasBall: true },
          { x: 20, y: 65, label: '2' },
          { x: 80, y: 65, label: '3' },
          { x: 15, y: 82, label: '4' },
          { x: 85, y: 82, label: '5' },
        ],
        description: 'Step 1: Starting 5-out spacing with Player 1 at the top.',
      },
      {
        positions: [
          { x: 50, y: 80, label: '1', hasBall: true },
          { x: 20, y: 65, label: '2' },
          { x: 80, y: 65, label: '3' },
          { x: 15, y: 82, label: '4' },
          { x: 85, y: 82, label: '5' },
        ],
        description: 'Step 2: Player 1 drives toward the basket. This forces the defense to help!',
        movements: [
          { from: 0, to: 0, type: 'dribble' },
        ],
      },
      {
        positions: [
          { x: 50, y: 80, label: '1', hasBall: true },
          { x: 20, y: 75, label: '2' },
          { x: 80, y: 65, label: '3' },
          { x: 15, y: 87, label: '4' },
          { x: 85, y: 87, label: '5' },
        ],
        description: 'Step 3: As the defense collapses, Player 3 lifts slightly for better passing angle.',
        movements: [
          { from: 2, to: 2, type: 'cut' },
        ],
      },
      {
        positions: [
          { x: 50, y: 80, label: '1' },
          { x: 20, y: 75, label: '2' },
          { x: 80, y: 65, label: '3', hasBall: true },
          { x: 15, y: 87, label: '4' },
          { x: 85, y: 87, label: '5' },
        ],
        description: 'Step 4: Player 1 kicks out to open Player 3 for a wide-open three-pointer!',
        movements: [
          { from: 0, to: 2, type: 'pass' },
        ],
      },
    ],
  },
  {
    name: 'Screen Away',
    description: 'Set a screen for a teammate on the opposite side to get them open.',
    steps: [
      {
        positions: [
          { x: 50, y: 45, label: '1', hasBall: true },
          { x: 20, y: 65, label: '2' },
          { x: 80, y: 65, label: '3' },
          { x: 15, y: 82, label: '4' },
          { x: 85, y: 82, label: '5' },
        ],
        description: 'Step 1: Standard 5-out spacing.',
      },
      {
        positions: [
          { x: 50, y: 45, label: '1' },
          { x: 20, y: 65, label: '2', hasBall: true },
          { x: 80, y: 65, label: '3' },
          { x: 15, y: 82, label: '4' },
          { x: 85, y: 82, label: '5' },
        ],
        description: 'Step 2: Pass from Player 1 to Player 2.',
        movements: [
          { from: 0, to: 1, type: 'pass' },
        ],
      },
      {
        positions: [
          { x: 75, y: 75, label: '1' },
          { x: 20, y: 75, label: '2', hasBall: true },
          { x: 80, y: 75, label: '3' },
          { x: 15, y: 87, label: '4' },
          { x: 85, y: 87, label: '5' },
        ],
        description: 'Step 3: Player 1 screens away (moves to screen for Player 3 on the opposite wing).',
        movements: [
          { from: 0, to: 0, type: 'screen', path: [{ x: 65, y: 65 }] },
        ],
      },
      {
        positions: [
          { x: 75, y: 75, label: '1' },
          { x: 20, y: 75, label: '2', hasBall: true },
          { x: 50, y: 55, label: '3' },
          { x: 15, y: 87, label: '4' },
          { x: 85, y: 87, label: '5' },
        ],
        description: 'Step 4: Player 3 uses the screen and cuts to the top of the key, getting open for a shot.',
        movements: [
          { from: 2, to: 2, type: 'cut', path: [{ x: 70, y: 65 }] },
        ],
      },
      {
        positions: [
          { x: 75, y: 75, label: '1' },
          { x: 20, y: 75, label: '2' },
          { x: 50, y: 55, label: '3', hasBall: true },
          { x: 15, y: 87, label: '4' },
          { x: 85, y: 87, label: '5' },
        ],
        description: 'Step 5: Player 2 passes to Player 3 for an open shot at the top!',
        movements: [
          { from: 1, to: 2, type: 'pass' },
        ],
      },
    ],
  },
  {
    name: 'Basket Cut and Fill',
    description: 'When a player cuts to the basket, others must "fill" their spot to maintain spacing.',
    steps: [
      {
        positions: [
          { x: 50, y: 45, label: '1', hasBall: true },
          { x: 20, y: 65, label: '2' },
          { x: 80, y: 65, label: '3' },
          { x: 15, y: 82, label: '4' },
          { x: 85, y: 82, label: '5' },
        ],
        description: 'Step 1: Ball at the top in 5-out spacing.',
      },
      {
        positions: [
          { x: 50, y: 55, label: '1', hasBall: true },
          { x: 20, y: 75, label: '2' },
          { x: 80, y: 75, label: '3' },
          { x: 30, y: 85, label: '4' },
          { x: 85, y: 87, label: '5' },
        ],
        description: 'Step 2: Player 4 makes a basket cut from the corner (trying to get open for a layup).',
        movements: [
          { from: 3, to: 3, type: 'cut' },
        ],
      },
      {
        positions: [
          { x: 50, y: 55, label: '1', hasBall: true },
          { x: 20, y: 82, label: '2' },
          { x: 80, y: 75, label: '3' },
          { x: 30, y: 85, label: '4' },
          { x: 85, y: 87, label: '5' },
        ],
        description: 'Step 3: Player 2 "fills down" toward the corner that Player 4 left.',
        movements: [
          { from: 1, to: 1, type: 'cut' },
        ],
      },
      {
        positions: [
          { x: 50, y: 55, label: '1', hasBall: true },
          { x: 15, y: 87, label: '2' },
          { x: 80, y: 75, label: '3' },
          { x: 20, y: 75, label: '4' },
          { x: 85, y: 87, label: '5' },
        ],
        description: 'Step 4: Player 4 continues to the weak-side wing. Player 2 fills the corner. Spacing is restored!',
        movements: [
          { from: 3, to: 3, type: 'cut' },
          { from: 1, to: 1, type: 'cut' },
        ],
      },
      {
        positions: [
          { x: 50, y: 55, label: '1' },
          { x: 15, y: 87, label: '2' },
          { x: 80, y: 75, label: '3' },
          { x: 20, y: 75, label: '4', hasBall: true },
          { x: 85, y: 87, label: '5' },
        ],
        description: 'Step 5: Ball is swung to Player 4 in their new position. The offense continues!',
        movements: [
          { from: 0, to: 3, type: 'pass', path: [{ x: 30, y: 60 }] },
        ],
      },
    ],
  },
  {
    name: 'Dribble Handoff (DHO)',
    description: 'A player dribbles toward a teammate and hands the ball off, creating confusion for defenders.',
    steps: [
      {
        positions: [
          { x: 50, y: 45, label: '1' },
          { x: 20, y: 65, label: '2', hasBall: true },
          { x: 80, y: 65, label: '3' },
          { x: 15, y: 82, label: '4' },
          { x: 85, y: 82, label: '5' },
        ],
        description: 'Step 1: Player 2 has the ball on the wing.',
      },
      {
        positions: [
          { x: 50, y: 55, label: '1' },
          { x: 35, y: 65, label: '2', hasBall: true },
          { x: 80, y: 75, label: '3' },
          { x: 15, y: 87, label: '4' },
          { x: 85, y: 87, label: '5' },
        ],
        description: 'Step 2: Player 2 dribbles toward Player 1 at the top.',
        movements: [
          { from: 1, to: 1, type: 'dribble' },
        ],
      },
      {
        positions: [
          { x: 45, y: 58, label: '1' },
          { x: 42, y: 62, label: '2', hasBall: true },
          { x: 80, y: 75, label: '3' },
          { x: 15, y: 87, label: '4' },
          { x: 85, y: 87, label: '5' },
        ],
        description: 'Step 3: Player 1 moves slightly toward Player 2. They meet for the handoff.',
        movements: [
          { from: 0, to: 0, type: 'cut' },
          { from: 1, to: 1, type: 'dribble' },
        ],
      },
      {
        positions: [
          { x: 50, y: 55, label: '1', hasBall: true },
          { x: 42, y: 62, label: '2' },
          { x: 80, y: 75, label: '3' },
          { x: 15, y: 87, label: '4' },
          { x: 85, y: 87, label: '5' },
        ],
        description: 'Step 4: Player 1 receives the handoff and now has the ball with momentum!',
        movements: [
          { from: 0, to: 0, type: 'cut' },
        ],
      },
      {
        positions: [
          { x: 50, y: 45, label: '1', hasBall: true },
          { x: 20, y: 65, label: '2' },
          { x: 80, y: 65, label: '3' },
          { x: 15, y: 82, label: '4' },
          { x: 85, y: 82, label: '5' },
        ],
        description: 'Step 5: Player 2 fills back to the wing. Spacing is maintained and the offense continues.',
        movements: [
          { from: 1, to: 1, type: 'cut' },
        ],
      },
    ],
  },
];

export const Training: React.FC = () => {
  const [selectedPlay, setSelectedPlay] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = fiveOutPlays[selectedPlay];
  const maxSteps = play.steps.length;

  // Auto-play functionality
  React.useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= maxSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 3000); // 3 seconds per step for smoother viewing

    return () => clearInterval(timer);
  }, [isPlaying, maxSteps]);

  const handlePlaySelect = (index: number) => {
    setSelectedPlay(index);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleNext = () => {
    if (currentStep < maxSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-600 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">5-Out Offense Training</h1>
        <p className="text-blue-100">
          Learn the fundamentals of 5-out offense with step-by-step animations
        </p>
      </div>

      <div className="p-4 max-w-6xl mx-auto">
        {/* Play Selector */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Select a Play:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fiveOutPlays.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handlePlaySelect(idx)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedPlay === idx
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow'
                }`}
              >
                <div className="font-semibold text-gray-900">{p.name}</div>
                <div className="text-sm text-gray-600 mt-1">{p.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Play Display */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{play.name}</h2>
            <p className="text-gray-600">{play.description}</p>
          </div>

          {/* Basketball Court */}
          <div className="mb-6">
            <BasketballCourt currentStep={currentStep} play={play} />
          </div>

          {/* Step Description */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white font-bold">
                  {currentStep + 1}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-gray-700">{play.steps[currentStep].description}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">
                Step {currentStep + 1} of {maxSteps}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / maxSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handlePrev}
                disabled={currentStep === 0}
                variant="secondary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </Button>

              <Button
                onClick={handlePlayPause}
                variant={isPlaying ? 'secondary' : 'primary'}
              >
                {isPlaying ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                    </svg>
                    Pause
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                    Play
                  </>
                )}
              </Button>

              <Button
                onClick={handleNext}
                disabled={currentStep === maxSteps - 1}
                variant="secondary"
              >
                Next
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>

              <Button onClick={handleReset} variant="secondary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Teaching Tips */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-3">Coaching Tips:</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span><strong>Spacing is key:</strong> Players should stay 15+ feet apart to stretch the defense</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span><strong>Read and react:</strong> Players must recognize when to cut, when to fill, and when to space</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span><strong>Always fill:</strong> When someone cuts, someone must fill their spot to maintain spacing</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span><strong>Keep it simple:</strong> Start with basic pass and cut, then add complexity as players improve</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
