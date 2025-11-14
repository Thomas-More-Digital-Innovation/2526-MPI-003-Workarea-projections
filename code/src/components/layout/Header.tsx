'use client'

import React from 'react';

interface HeaderProps {
  text: string;
}

const Header: React.FC<HeaderProps> = ({ text }) => {
  return (
    <div className="px-4 pt-4 pb-2 flex-shrink-0">
      <div className="mx-auto max-w rounded-2xl shadow-md" style={{ backgroundColor: 'var(--color-white)', padding: '0.75rem' }}>
        <h1 className="text-center text-4xl px-6 py-3.5 font-semibold text-[var(--dark-text)]">{text}</h1>
      </div>
    </div>
  );
};

export default Header;