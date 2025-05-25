// src/pages/SettingsPage.tsx
import { Modal, ModalContent, ModalHeader, ModalBody, Switch, NumberInput } from "@heroui/react";
import { useThemeStore } from "../lib/useThemeStore";
import { useSoundSettingsStore } from "../lib/useSoundSettingsStore";
import { Image } from "@heroui/react";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPage = ({ isOpen, onClose }: SettingsProps) => {
  const { theme, setTheme } = useThemeStore();
  const {
    typingSoundEnabled,
    typingSoundDelay,
    setTypingSoundEnabled,
    setTypingSoundDelay,
  } = useSoundSettingsStore();

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col items-start gap-1">
            <h2 className="text-sm font-semibold text-zinc-400">Settings</h2>
            <p className="text-xs text-zinc-500">Customize your experience</p>
          </ModalHeader>

          <ModalBody className="space-y-6 w-full">

            {/* Theme Switcher */}
            <div className="w-full">
              <h3 className="text-base font-medium text-zinc-600 mb-2">Theme</h3>
              <div className="flex justify-center items-center gap-4">
                {/* Light Theme */}
                <div
                  className={`relative cursor-pointer rounded-xl p-1 transition-all ${
                    theme === "light" ? "ring-2 ring-primary-500" : "ring-1 ring-zinc-300"
                  }`}
                  onClick={() => setTheme("light")}
                >
                  <Image
                    src="/themes/light.png"
                    alt="Light Theme"
                    width={120}
                    height={80}
                    className="rounded-lg"
                  />
                  <span className="block text-center text-sm mt-1 text-zinc-600">Light</span>
                </div>

                {/* Dark Theme */}
                <div
                  className={`relative cursor-pointer rounded-xl p-1 transition-all ${
                    theme === "dark" ? "ring-2 ring-primary-500" : "ring-1 ring-zinc-300"
                  }`}
                  onClick={() => setTheme("dark")}
                >
                  <Image
                    src="/themes/dark.png"
                    alt="Dark Theme"
                    width={120}
                    height={80}
                    className="rounded-lg"
                  />
                  <span className="block text-center text-sm mt-1 text-zinc-600">Dark</span>
                </div>

                {/* Vibrant Theme */}
                <div
                  className={`relative cursor-pointer rounded-xl p-1 transition-all ${
                    theme === "vibrant" ? "ring-2 ring-primary-500" : "ring-1 ring-zinc-300"
                  }`}
                  onClick={() => setTheme("vibrant")}
                >
                  <Image
                    src="/themes/vibrant.png"
                    alt="Vibrant Theme"
                    width={120}
                    height={80}
                    className="rounded-lg"
                  />
                  <span className="block text-center text-sm mt-1 text-zinc-600">Vibrant</span>
                </div>
              </div>
            </div>

            {/* Typing Sounds */}
            <div className="w-full">
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
            </div>
          </ModalBody>
        </>
      </ModalContent>
    </Modal>
  );
};

export default SettingsPage;
