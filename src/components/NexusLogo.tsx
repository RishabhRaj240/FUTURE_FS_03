import React from 'react';

interface NexusLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'hero' | 'header';
}

export const NexusLogo: React.FC<NexusLogoProps> = ({ 
  className = '', 
  size = 'md',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl'
  };

  const variantClasses = {
    default: 'font-extrabold tracking-tight',
    hero: 'font-black tracking-tighter',
    header: 'font-extrabold tracking-tight'
  };

  return (
    <div className={`relative ${className}`}>
      {/* Blurred background effect - more prominent like the REDEFINE image */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-400/30 via-emerald-500/30 to-yellow-400/30 blur-2xl rounded-lg scale-110"></div>
      <div className="absolute inset-0 bg-gradient-to-l from-blue-400/20 via-purple-500/20 to-pink-400/20 blur-xl rounded-lg scale-105"></div>
      
      {/* Main logo text */}
      <div className={`relative z-10 ${sizeClasses[size]} ${variantClasses[variant]} text-white uppercase select-none drop-shadow-lg`}>
        NEXUS
      </div>
    </div>
  );
};

export default NexusLogo;
