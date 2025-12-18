'use client';

import React from 'react';

interface FabProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Fab: React.FC<FabProps> = ({ onClick, children, className }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-8 right-8 bg-primary text-primary-foreground h-14 w-14 rounded-full shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-transform hover:scale-110 ${className}`}
    >
      {children}
    </button>
  );
};
