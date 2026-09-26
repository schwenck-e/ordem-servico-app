import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="w-full bg-white divide-y divide-slate-100 animate-pulse">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-6 py-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={`h-4 bg-slate-200 rounded ${
                colIndex === 0
                  ? 'w-1/4'
                  : colIndex === columns - 1
                  ? 'w-16 ml-auto'
                  : 'w-1/6'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
