'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Cat, Clover, Film, Tv } from 'lucide-react';

interface CategoryOption {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
}

interface DoubanCategorySelectorProps {
  currentType: string;
  onTypeChange: (type: string) => void;
}

const DoubanCategorySelector: React.FC<DoubanCategorySelectorProps> = ({
  currentType,
  onTypeChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  const categoryOptions: CategoryOption[] = [
    {
      label: '电影',
      value: 'movie',
      icon: Film,
    },
    {
      label: '剧集',
      value: 'tv',
      icon: Tv,
    },
    {
      label: '动漫',
      value: 'anime',
      icon: Cat,
    },
    {
      label: '综艺',
      value: 'show',
      icon: Clover,
    },
  ];

  // 更新指示器位置
  const updateIndicator = () => {
    const activeIndex = categoryOptions.findIndex(
      (option) => option.value === currentType
    );
    
    if (activeIndex >= 0 && buttonRefs.current[activeIndex]) {
      const activeButton = buttonRefs.current[activeIndex];
      if (activeButton) {
        const { offsetLeft, offsetWidth } = activeButton;
        setIndicatorStyle({
          left: offsetLeft,
          width: offsetWidth,
        });
      }
    }
  };

  // 初始化指示器位置
  useEffect(() => {
    updateIndicator();
  }, [currentType]);

  // 窗口大小变化时重新计算指示器位置
  useEffect(() => {
    const handleResize = () => {
      updateIndicator();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentType]);

  const handleCategoryChange = (type: string) => {
    onTypeChange(type);
  };

  return (
    <div className='w-full'>
      {/* 分类选择器 */}
      <div className='relative inline-flex bg-gray-100/50 dark:bg-gray-800/50 rounded-full p-1.5 backdrop-blur-sm'>
        {/* 动态指示器 */}
        <div
          className='absolute top-1.5 bottom-1.5 bg-white dark:bg-gray-700 rounded-full shadow-sm transition-all duration-300 ease-out'
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
        
        <div
          ref={containerRef}
          className='relative flex items-center space-x-1'
        >
          {categoryOptions.map((option, index) => {
            const Icon = option.icon;
            const isActive = currentType === option.value;
            
            return (
              <button
                key={option.value}
                ref={(el) => {
                  buttonRefs.current[index] = el;
                }}
                onClick={() => handleCategoryChange(option.value)}
                className={`relative flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 min-w-[80px] ${
                  isActive
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Icon className='w-4 h-4 mr-2' />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DoubanCategorySelector;