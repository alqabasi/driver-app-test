
import React from 'react';
import { audioService, SoundType } from '../../services/audioService';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  onClick,
  ...props 
}) => {
  const baseStyles = "font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/50";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200",
    secondary: "bg-white text-blue-900 border border-blue-100 hover:bg-blue-50 shadow-slate-100",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-red-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100",
    outline: "border-2 border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg",
    xl: "px-8 py-5 text-xl"
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    audioService.play(SoundType.TAP);
    if (onClick) onClick(e);
  };

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};
