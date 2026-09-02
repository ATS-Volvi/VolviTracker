import React from 'react';

export const StatusPieChart = ({ notStarted = 0, inProgress = 0, done = 0, size = 110, strokeWidth = 9.5 }) => {
  const total = notStarted + inProgress + done;

  if (total === 0) {
    return (
      <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 42 42" className="transform -rotate-90">
          <circle
            cx="21"
            cy="21"
            r="15"
            fill="transparent"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
          />
        </svg>
        <span className="absolute text-sm font-bold text-gray-400">0</span>
      </div>
    );
  }

  const radius = 15;
  const circumference = 2 * Math.PI * radius;

  const doneShare = (done / total) * circumference;
  const inProgressShare = (inProgress / total) * circumference;
  const notStartedShare = (notStarted / total) * circumference;

  const doneOffset = 0;
  const inProgressOffset = -doneShare;
  const notStartedOffset = -(doneShare + inProgressShare);

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 42 42" className="transform -rotate-90 overflow-visible">
        {/* Background track */}
        <circle
          cx="21"
          cy="21"
          r={radius}
          fill="transparent"
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
        />
        {/* Done Segment (Emerald) */}
        {done > 0 && (
          <circle
            cx="21"
            cy="21"
            r={radius}
            fill="transparent"
            stroke="#10B981"
            strokeWidth={strokeWidth}
            strokeDasharray={`${doneShare} ${circumference}`}
            strokeDashoffset={doneOffset}
            className="transition-all duration-700 ease-out"
          />
        )}
        {/* In Progress Segment (Blue) */}
        {inProgress > 0 && (
          <circle
            cx="21"
            cy="21"
            r={radius}
            fill="transparent"
            stroke="#3B82F6"
            strokeWidth={strokeWidth}
            strokeDasharray={`${inProgressShare} ${circumference}`}
            strokeDashoffset={inProgressOffset}
            className="transition-all duration-700 ease-out"
          />
        )}
        {/* Not Started Segment (Slate Gray) */}
        {notStarted > 0 && (
          <circle
            cx="21"
            cy="21"
            r={radius}
            fill="transparent"
            stroke="#CBD5E1"
            strokeWidth={strokeWidth}
            strokeDasharray={`${notStartedShare} ${circumference}`}
            strokeDashoffset={notStartedOffset}
            className="transition-all duration-700 ease-out"
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
        <span className={`font-black text-gray-900 leading-none ${size >= 100 ? 'text-xl' : size >= 90 ? 'text-lg' : 'text-sm'}`}>
          {total}
        </span>
        <span className={`font-semibold text-gray-400 uppercase tracking-tight ${size >= 100 ? 'text-[10px] mt-1' : size >= 90 ? 'text-[10px] mt-0.5' : 'text-[8px]'}`}>
          total
        </span>
      </div>
    </div>
  );
};

export default StatusPieChart;
