// src/components/ThemeToggle.tsx
import { useThemeStore } from '../lib/useThemeStore'
import { Button } from "@heroui/react";
import { MoonIcon, SunIcon } from "@heroicons/react/16/solid";
import { useEffect, useState } from 'react'

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null // avoid SSR mismatch

  return (
    <Button
      isIconOnly
      variant='solid'
      aria-label='Switch Theme'
      title='Switch Theme'
      onPress={toggleTheme}
      className={className}
    >
      <div className="relative w-8 h-8">
        <SunIcon
          className={`absolute inset-0 h-8 w-8 transition-all duration-300 text-zinc-800 ${
            theme === 'light' ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-150 blur-md'
          }`}
        />
        <MoonIcon
          className={`absolute inset-0 h-8 w-8 transition-all duration-300 text-white ${
            theme === 'dark' ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-80 blur-md'
          }`}
        />
      </div>
    </Button>
  )
}