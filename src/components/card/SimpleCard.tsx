import React, { ReactNode } from 'react';
import CardHeader from '@/components/card/CardHeader';
import CardBase from '@/components/card/CardBase';

interface CardProps {
  title?: string;
  children: ReactNode;
  dropdownItems?: ReactNode[];
  leftAdornment?: ReactNode;
}

const SimpleCard: React.FC<CardProps> = ({ title, children, dropdownItems, leftAdornment }) => {
  return (
    <CardBase>
      {title && <CardHeader title={title} /*dropdownItems={dropdownItems} leftAdornment={leftAdornment}*/ />}
      {children}
    </CardBase>
  );
};

export default SimpleCard;