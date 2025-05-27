// src/pages/SettingsPage.tsx
import { Switch, NumberInput } from "@heroui/react";
import { useThemeStore } from "../lib/useThemeStore";
import { useSoundSettingsStore } from "../lib/useSoundSettingsStore";
import { Image } from "@heroui/react";

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const {
    typingSoundEnabled,
    typingSoundDelay,
    setTypingSoundEnabled,
    setTypingSoundDelay,
  } = useSoundSettingsStore();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-800">Settings</h2>
        <p className="text-sm text-zinc-500">Customize your experience</p>
      </header>

      <div className="space-y-10">

        {/* Theme Switcher */}
        <section className="w-full">
          <h3 className="text-base font-medium text-zinc-600 mb-2">Theme</h3>
          <div className="flex justify-center items-center gap-4">
            {/* Light Theme */}
            <div onClick={() => setTheme("light")}>
              <Image
                src="/themes/light.png"
                alt="Light Theme"
                width={160}
                height={100}
                className={`cursor-pointer ${
                  theme === "light" ? "ring-2 ring-primary-500" : "ring-1 ring-zinc-300"
                }`}
              />
            </div>

            {/* Dark Theme */}
            <div onClick={() => setTheme("dark")}>
              <Image
                src="/themes/dark.png"
                alt="Dark Theme"
                width={160}
                height={100}
                className={`cursor-pointer ${
                  theme === "dark" ? "ring-2 ring-primary-500" : "ring-1 ring-zinc-300"
                }`}
              />
            </div>
          </div>
        </section>

        {/* Typing Sounds */}
        <section className="w-full">
          <h3 className="text-base font-medium text-zinc-600 mb-2">Typing Sounds</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-700">Enable Typing Sounds</span>
              <Switch
                checked={typingSoundEnabled}
                onChange={(e) => setTypingSoundEnabled(e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-700">Sound Interval (ms)</span>
              <NumberInput
                size="sm"
                radius="lg"
                className="max-w-36 p-1"
                min={0}
                max={10000}
                value={typingSoundDelay}
                onChange={(value) => {
                  if (typeof value === "number") {
                    setTypingSoundDelay(value);
                  }
                }}
                placeholder="Enter delay"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
