import React from 'react';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  title: string;
  data: BarData[];
  maxValue?: number;
  showValues?: boolean;
  horizontal?: boolean;
}

export function SimpleBarChart({
  title,
  data,
  maxValue: providedMax,
  showValues = true,
  horizontal = false
}: SimpleBarChartProps) {
  const maxValue = providedMax || Math.max(...data.map(d => d.value), 1);

  if (horizontal) {
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">{title}</h4>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-16 text-xs text-gray-600 truncate">{item.label}</div>
              <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                <div
                  className={`h-full ${item.color || 'bg-blue-500'} transition-all duration-300`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
              {showValues && (
                <div className="w-10 text-xs text-right font-medium">{item.value}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm">{title}</h4>
      <div className="flex items-end gap-1 h-32">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex-1 w-full flex items-end justify-center">
              <div
                className={`w-full max-w-8 ${item.color || 'bg-blue-500'} rounded-t transition-all duration-300`}
                style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: item.value > 0 ? '4px' : '0' }}
              />
            </div>
            {showValues && (
              <div className="text-xs font-medium">{item.value}</div>
            )}
            <div className="text-[10px] text-gray-600 text-center truncate w-full">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PercentageBarProps {
  label: string;
  made: number;
  attempts: number;
  color?: string;
}

export function PercentageBar({ label, made, attempts, color = 'bg-green-500' }: PercentageBarProps) {
  const percentage = attempts > 0 ? (made / attempts) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{made}/{attempts} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="h-3 bg-gray-100 rounded overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
