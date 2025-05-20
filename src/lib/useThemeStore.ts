// src/lib/useThemeStore.ts
import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
  }
  return 'light'
}

export const useThemeStore = create<ThemeStore>((set) => {
  const theme = getInitialTheme()
  // Set the theme on HTML when the store is created
  document.documentElement.classList.toggle('dark', theme === 'dark')

  return {
    theme,
    setTheme: (theme) => {
      set({ theme })
      localStorage.setItem('theme', theme)
      document.documentElement.classList.toggle('dark', theme === 'dark')
    },
    toggleTheme: () =>
      set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light'
        localStorage.setItem('theme', newTheme)
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
        return { theme: newTheme }
      }),
  }
})
