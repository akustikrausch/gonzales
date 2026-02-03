interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
    >
      {/* Teal circle background - matches HA addon icon */}
      <circle cx="16" cy="16" r="15" fill="#1B9B8C" />
      {/* Speed lines */}
      <path
        d="M6 10C10 10 18 8 26 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 15C10 14 18 13 26 16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 20C10 19 18 18 26 20"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 25C10 24 18 23 26 24"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Speed dots */}
      <circle cx="8" cy="7" r="1" fill="white" opacity="0.7" />
      <circle cx="12" cy="5" r="0.8" fill="white" opacity="0.5" />
      <circle cx="24" cy="8" r="0.8" fill="white" opacity="0.5" />
    </svg>
  );
}
