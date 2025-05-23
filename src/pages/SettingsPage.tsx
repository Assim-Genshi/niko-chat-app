import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, NumberInput, Switch } from "@heroui/react";
import { useThemeStore } from "../lib/useThemeStore";
import { useSoundSettingsStore } from "../lib/useSoundSettingsStore";
import { IconMoon, IconSun } from "@tabler/icons-react";

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
        {(handleClose) => (
          <>
            <ModalHeader className="flex flex-col items-start gap-1">
              <h2 className="text-sm font-semibold text-zinc-400">Settings</h2>
              <p className="text-xs text-zinc-500">Customize your experience</p>
            </ModalHeader>

            <ModalBody className="space-y-6 w-full">
              {/* Theme Switcher */}
              <div className="w-full">
                <h3 className="text-base font-medium text-zinc-600">Theme Switcher</h3>
                <div className="flex items-center gap-4 mt-2">
                  <Button
                    variant="light"
                    color={theme === "light" ? "primary" : "secondary"}
                    onPress={() => setTheme("light")}
                    className="flex items-center gap-2"
                  >
                    <IconSun className="h-4 w-4" /> Light Mode
                  </Button>
                  
                  <Button
                    variant="light"
                    color={theme === "dark" ? "primary" : "secondary"}
                    onPress={() => setTheme("dark")}
                    className="flex items-center gap-2"
                  >
                    <IconMoon className="h-4 w-4" /> Dark Mode
                  </Button>
                </div>
              </div>

              {/* Typing Sounds */}
              <div className="w-full">
                <h3 className="text-base font-medium text-zinc-600">Typing Sounds</h3>
                <div className="flex flex-col gap-3 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-700">Enable Typing Sounds</span>
                    <Switch checked={typingSoundEnabled} onChange={(e) => setTypingSoundEnabled(e.target.checked)} />
                  </div>
                  
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-zinc-700">Sound Interval (ms)</span>
                    <NumberInput
                      size="sm"
                      className="max-w-36" 
                      min={0}
                      max={10000}
                      // onChange={(e) => setTypingSoundDelay(Number(e.target.value))}
                      value={typingSoundDelay}
                      placeholder="Enter the amount"
                    />
                    
                  </div>
                </div>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default SettingsPage;
