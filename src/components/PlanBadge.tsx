// src/components/PlanBadge.tsx
import React from 'react';
import { Chip } from '@heroui/react';
import { CheckBadgeIcon, SparklesIcon, } from '@heroicons/react/24/solid';
import { Profile } from '../types';

interface PlanBadgeProps {
  plan: Profile['plan'];
  className?: string;
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({ plan, className = 'w-5 h-5' }) => {
  if (!plan || plan === 'free') {
    return null; // Don't render anything for free plan
  }

  const badgeInfo = {
    verified: {
      icon: <><Chip size='sm' color="primary" startContent={<CheckBadgeIcon className='w-4 h-4'/>} variant="flat" >Verified</Chip></>,
    },
    premium: {
      icon: <><Chip size='sm' color="secondary" startContent={<SparklesIcon className='w-4 h-' />} variant="flat">Premium</Chip></>,
    },
    vip: {
      icon: <><Chip size='sm' color="warning" startContent={<SparklesIcon className='w-4 h-4' />} variant="flat">VIP</Chip></>,
    },
  };

  const badge = badgeInfo[plan];

  if (!badge) {
    return null;
  }

  return (
   
    <div>{badge.icon}</div>
   
  );
};