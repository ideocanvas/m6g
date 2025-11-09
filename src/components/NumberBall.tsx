'use client';

import { NumberBallProps } from '@/types/mark6';

export default function NumberBall({
  number,
  selected = false,
  onClick,
  size = 'md',
  highlight = 'none',
}: NumberBallProps) {
  const getBallColor = (num: number) => {
    const redNumbers = [1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46];
    const blueNumbers = [3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48];
    
    if (redNumbers.includes(num)) return 'from-red-400 to-red-600';
    if (blueNumbers.includes(num)) return 'from-blue-400 to-blue-600';
    return 'from-green-400 to-green-600';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-xs';
      case 'md':
        return 'w-10 h-10 text-sm';
      case 'lg':
        return 'w-12 h-12 text-base';
      default:
        return 'w-10 h-10 text-sm';
    }
  };

  const getHighlightClasses = () => {
    switch (highlight) {
      case 'winning':
        return 'ring-4 ring-orange-500 shadow-lg';
      case 'special':
        return 'ring-4 ring-gray-400 shadow-lg';
      case 'none':
      default:
        return '';
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(number);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative rounded-full font-bold text-white shadow-md
        bg-linear-to-br ${getBallColor(number)}
        transition-all duration-200 hover:scale-110 hover:shadow-lg
        ${getSizeClasses()}
        ${selected ? 'ring-4 ring-yellow-400 transform scale-110 shadow-lg' : ''}
        ${getHighlightClasses()}
        flex items-center justify-center
      `}
    >
      <span className="relative z-10 drop-shadow-sm">
        {number}
      </span>
      
      {/* Inner shine effect */}
      <div className="absolute inset-0 rounded-full bg-linear-to-br from-white/20 to-transparent opacity-50" />
    </button>
  );
}