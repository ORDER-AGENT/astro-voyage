import React, { ReactNode } from 'react';

interface CardBaseProps {
  children: ReactNode;
}

const CardBase: React.FC<CardBaseProps> = ({ children }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      {children}
    </div>
  );
};

export default CardBase;