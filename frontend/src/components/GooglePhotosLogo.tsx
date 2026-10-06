import React from 'react';

interface GooglePhotosLogoProps {
  size?: number;
  className?: string;
}

export default function GooglePhotosLogo({ size = 28, className }: GooglePhotosLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Google Photos Logo"
      style={{ display: 'inline-block', flexShrink: 0 }}
    >
      {/* Top Petal - Red */}
      <path
        d="M12 0C8.686 0 6 2.686 6 6v6h6c3.314 0 6-2.686 6-6s-2.686-6-6-6z"
        fill="#EA4335"
      />
      {/* Right Petal - Yellow */}
      <path
        d="M24 12c0-3.314-2.686-6-6-6h-6v6c0 3.314 2.686 6 6 6s6-2.686 6-6z"
        fill="#FBBC04"
      />
      {/* Bottom Petal - Green */}
      <path
        d="M12 24c3.314 0 6-2.686 6-6v-6h-6c-3.314 0-6 2.686-6 6s2.686 6 6 6z"
        fill="#34A853"
      />
      {/* Left Petal - Blue */}
      <path
        d="M0 12c0 3.314 2.686 6 6 6h6v-6c0-3.314-2.686-6-6-6s-6 2.686-6 6z"
        fill="#4285F4"
      />
    </svg>
  );
}
