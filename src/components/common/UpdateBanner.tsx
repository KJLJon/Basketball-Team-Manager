import React from 'react';
import { Button } from './Button';

interface UpdateBannerProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateBanner({ onUpdate, onDismiss }: UpdateBannerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 shadow-lg z-50 animate-slide-down">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-semibold">Update Available</p>
          <p className="text-sm text-blue-100">A new version of the app is ready to install</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={onDismiss}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            Later
          </Button>
          <Button
            onClick={onUpdate}
            className="bg-blue-800 hover:bg-blue-900 text-white"
          >
            Update Now
          </Button>
        </div>
      </div>
    </div>
  );
}
