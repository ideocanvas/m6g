/* eslint-disable @next/next/no-img-element */
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
    
    if (redNumbers.includes(num)) return 'red';
    if (blueNumbers.includes(num)) return 'blue';
    return 'green';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'w-6 h-6 text-xs';
      case 'sm':
        return 'w-8 h-8 text-xs';
      case 'md':
        return 'w-10 h-10 text-sm';
      case 'lg':
        return 'w-12 h-12 text-base';
      case 'xl':
        return 'w-14 h-14 text-lg';
      default:
        return 'w-10 h-10 text-sm';
    }
  };

  const getHighlightClasses = () => {
    // Use appropriate ring width based on ball size
    let ringWidth = 'ring-4'; // Default for md, lg, xl
    
    if (size === 'xs' || size === 'sm') {
      ringWidth = 'ring-2'; // Smaller ring for smaller balls
    }
    
    switch (highlight) {
      case 'winning':
        return `${ringWidth} ring-orange-500 shadow-lg`;
      case 'special':
        return `${ringWidth} ring-gray-400 shadow-lg`;
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

  const ballColor = getBallColor(number);

  return (
    <button
      onClick={handleClick}
      className={`
        relative rounded-full font-bold text-white shadow-md
        transition-all duration-200 hover:scale-110 hover:shadow-lg
        ${getSizeClasses()}
        ${selected ? `${size === 'xs' || size === 'sm' ? 'ring-2' : 'ring-4'} ring-yellow-400 transform scale-110 shadow-lg` : ''}
        ${getHighlightClasses()}
        flex items-center justify-center overflow-hidden
      `}
    >
      {/* SVG Background using img tags */}
      <div className="absolute inset-0">
        {ballColor === 'red' && (
          <img
            src="/mark6/red-ball.svg"
            alt="Red ball"
            className="w-full h-full object-cover"
          />
        )}
        {ballColor === 'blue' && (
          <img
            src="/mark6/blue-ball.svg"
            alt="Blue ball"
            className="w-full h-full object-cover"
          />
        )}
        {ballColor === 'green' && (
          <img
            src="/mark6/green-ball.svg"
            alt="Green ball"
            className="w-full h-full object-cover"
          />
        )}
      </div>
      
      {/* Number overlay */}
      <span className="relative z-10 drop-shadow-sm font-bold text-black">
        {number}
      </span>
    </button>
  );
}