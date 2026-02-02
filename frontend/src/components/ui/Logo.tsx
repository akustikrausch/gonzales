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
      <rect width="32" height="32" rx="8" fill="var(--g-blue)" />
      <path
        d="M20.5 8H12C10.9 8 10 8.9 10 10V18.5C10 19.88 11.12 21 12.5 21H14L12 25H15L17 21H20.5C21.88 21 23 19.88 23 18.5V10.5C23 9.12 21.88 8 20.5 8Z"
        fill="white"
      />
      <path
        d="M25 12L27 11M25 16H28M25 20L27 21"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}
