
import React from 'react';

export const HesabKetabLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 7V4h16v3" />
    <path d="M9 20h6" />
    <path d="M12 4v16" />
    <path d="M17 20h-2" />
    <path d="M17 4h-2" />
    <path d="M9 4H7" />
    <path d="M9 20H7" />
    <path d="M21 12H3" />
  </svg>
);


export const SignatureAli = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M10 40 C 20 10, 40 10, 60 40 C 70 60, 90 60, 100 40 L 120 20 C 140 -10, 160 30, 180 40 L 190 45" stroke="currentColor" fill="transparent" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
  
export const SignatureFatemeh = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg" {...props}>
       <path d="M10 30 Q 50 70, 90 30 T 170 30 C 180 30, 190 40, 190 40" stroke="currentColor" fill="transparent" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
