//src/components/ThemedImage.tsx
import { useThemeStore } from "../lib/useThemeStore";

interface ThemedImageProps {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ThemedImage({
  lightSrc,
  darkSrc,
  alt,
  width,
  height,
  className = '',
}: ThemedImageProps) {
  const { theme } = useThemeStore();

  const src = theme === 'dark' ? darkSrc : lightSrc;

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}
