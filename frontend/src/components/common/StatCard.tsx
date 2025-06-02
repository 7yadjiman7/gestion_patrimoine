import type { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
};

export const StatCard = ({ 
  title, 
  value, 
  icon,
  trend = 'neutral',
  trendValue 
}: StatCardProps) => {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500'
  };

  return (
    <div className="stat-card bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-full bg-blue-50 text-blue-500">
          {icon}
        </div>
      </div>
      {trendValue && (
        <div className={`mt-2 text-sm flex items-center ${trendColors[trend]}`}>
          {trend === 'up' && <span>↑</span>}
          {trend === 'down' && <span>↓</span>}
          {trendValue}
        </div>
      )}
    </div>
  );
};
