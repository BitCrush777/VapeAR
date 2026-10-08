import React from 'react';

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  colors?: string[];
  duration?: string;
}

export const AnimatedGradientText: React.FC<AnimatedGradientTextProps> = ({
  children,
  style = {},
  colors = ['#ffffff', '#ff80ab', '#d4af37', '#80d8ff', '#ffffff'],
  duration = '6s'
}) => {
  const gradient = `linear-gradient(90deg, ${colors.join(', ')})`;

  return (
    <span
      style={{
        background: gradient,
        backgroundSize: '300% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: `gradient-flow ${duration} linear infinite`,
        display: 'inline-block',
        ...style
      }}
    >
      {children}
    </span>
  );
};
