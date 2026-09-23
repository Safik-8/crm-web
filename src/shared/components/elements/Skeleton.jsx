import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Production-ready Skeleton loader component.
 * Supports Tailwind utility classes (className="h-4 w-20") as well as
 * standard design-system props (variant, width, height, animation).
 */
const Skeleton = ({
  className,
  variant = 'rectangular', // 'circular' | 'rounded' | 'text' | 'rectangular'
  width,
  height,
  animation = 'pulse', // 'pulse' | 'none'
  style = {},
  ...props
}) => {
  const variantClass = {
    circular: 'rounded-full',
    rounded: 'rounded-xl',
    text: 'rounded h-4 my-1',
    rectangular: 'rounded-md',
  }[variant] || 'rounded-md';

  const animationClass = animation === 'pulse' ? 'animate-pulse' : '';

  const inlineStyles = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...style,
  };

  return (
    <div
      className={cn(
        'bg-slate-200/80 shrink-0',
        animationClass,
        variantClass,
        className
      )}
      style={inlineStyles}
      {...props}
    />
  );
};

export default Skeleton;
