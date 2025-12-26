
import React from 'react';

export const TranslateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 22V2l4.13 12.5L12 2" />
    <path d="M12 14h10" />
    <path d="M17 10l-2 8" />
    <path d="M22 10l-2 8" />
    <path d="M15 14h4" />
  </svg>
);