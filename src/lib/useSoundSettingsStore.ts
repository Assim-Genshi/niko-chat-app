// useSoundSettingsStore.ts
import { create } from "zustand";

interface SoundSettingsState {
  typingSoundEnabled: boolean;
  typingSoundDelay: number;
  setTypingSoundEnabled: (enabled: boolean) => void;
  setTypingSoundDelay: (delay: number) => void;
}

export const useSoundSettingsStore = create<SoundSettingsState>((set) => ({
  typingSoundEnabled: true,
  typingSoundDelay: 3000,
  setTypingSoundEnabled: (enabled) => set({ typingSoundEnabled: enabled }),
  setTypingSoundDelay: (delay) => set({ typingSoundDelay: delay }),
}));
