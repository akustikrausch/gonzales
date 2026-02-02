import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedNumber({
  value,
  decimals = 1,
  duration = 600,
  className = "",
  style,
}: AnimatedNumberProps) {
  const animated = useAnimatedNumber(value, duration);

  return (
    <span className={`tabular-nums ${className}`} style={style}>
      {animated.toFixed(decimals)}
    </span>
  );
}
