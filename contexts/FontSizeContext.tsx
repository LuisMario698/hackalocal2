import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const STEPS = [0.8, 0.9, 1.0, 1.1, 1.25, 1.45];

interface FontSizeCtx {
  step: number;
  scale: number;
  setStep: (s: number) => void;
  fs: (base: number) => number;
}

const FontSizeContext = createContext<FontSizeCtx>({
  step: 2,
  scale: 1,
  setStep: () => {},
  fs: (n) => n,
});

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(2); // default = 1.0x
  const scale = STEPS[step] ?? 1;
  const fs = useCallback((base: number) => Math.round(base * scale), [scale]);

  return (
    <FontSizeContext.Provider value={{ step, scale, setStep, fs }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export const useFontSize = () => useContext(FontSizeContext);
export const FONT_STEP_COUNT = STEPS.length;
