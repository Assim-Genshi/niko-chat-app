// src/lib/useThemeStore.ts
import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'vibrant'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light' || saved === 'vibrant') return saved as Theme
  }
  return 'light'
}

export const useThemeStore = create<ThemeStore>((set) => {
  const theme = getInitialTheme()
  // Set the theme on HTML when the store is created
  document.documentElement.classList.remove('dark', 'vibrant')
  document.documentElement.classList.add(theme)

  return {
    theme,
    setTheme: (theme) => {
      set({ theme })
      localStorage.setItem('theme', theme)
      document.documentElement.classList.remove('dark', 'vibrant', 'light')
      document.documentElement.classList.add(theme)
    },
    toggleTheme: () =>
      set((state) => {
        let newTheme: Theme
        if (state.theme === 'light') {
          newTheme = 'dark'
        } else if (state.theme === 'dark') {
          newTheme = 'vibrant'
        } else {
          newTheme = 'light'
        }
        localStorage.setItem('theme', newTheme)
        document.documentElement.classList.remove('dark', 'vibrant', 'light')
        document.documentElement.classList.add(newTheme)
        return { theme: newTheme }
      }),
  }
})
