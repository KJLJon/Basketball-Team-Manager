import React from 'react';

interface EditableStatRowProps {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function EditableStatRow({ label, value, onIncrement, onDecrement }: EditableStatRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={value === 0}
          className="w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold hover:bg-red-200 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          −
        </button>
        <span className="text-lg font-bold w-8 text-center">{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          className="w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold hover:bg-green-200 active:scale-95 transition-all"
        >
          +
        </button>
      </div>
    </div>
  );
}
