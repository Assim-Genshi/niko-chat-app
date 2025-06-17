// src/components/PlanBadge.tsx
import React from 'react';
import { Tooltip } from '@heroui/react';
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
      icon: <CheckBadgeIcon className={`${className} text-sky-500`} />,
      label: 'Verified Account',
    },
    premium: {
      icon: <SparklesIcon className={`${className} text-purple-500`} />,
      label: 'Premium Member',
    },
    vip: {
      icon: <SparklesIcon className={`${className} text-yellow-500`} />,
      label: 'VIP Member',
    },
  };

  const badge = badgeInfo[plan];

  if (!badge) {
    return null;
  }

  return (
    <Tooltip content={badge.label} placement="top">
      <span>{badge.icon}</span>
    </Tooltip>
  );
};