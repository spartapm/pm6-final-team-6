"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import CoachMarkOverlay from "./CoachMarkOverlay";
import { getFeatureHelpTour } from "@/lib/featureHelp/tours";

type ActiveTour = { tourId: string; stepIndex: number };

type FeatureHelpContextValue = {
  startTour: (tourId: string) => void;
  isActive: boolean;
  activeTour: ActiveTour | null;
};

const FeatureHelpContext = createContext<FeatureHelpContextValue | null>(null);

export function FeatureHelpProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveTour | null>(null);

  const startTour = useCallback((tourId: string) => {
    const tour = getFeatureHelpTour(tourId);
    if (!tour?.steps.length) return;
    setActive({ tourId, stepIndex: 0 });
  }, []);

  const advance = useCallback(() => {
    setActive((prev) => {
      if (!prev) return null;
      const tour = getFeatureHelpTour(prev.tourId);
      if (!tour) return null;
      if (prev.stepIndex >= tour.steps.length - 1) return null;
      return { tourId: prev.tourId, stepIndex: prev.stepIndex + 1 };
    });
  }, []);

  const close = useCallback(() => setActive(null), []);

  const value = useMemo(
    () => ({
      startTour,
      isActive: Boolean(active),
      activeTour: active,
    }),
    [startTour, active]
  );

  const tour = active ? getFeatureHelpTour(active.tourId) : null;
  const step = tour && active ? tour.steps[active.stepIndex] : null;

  return (
    <FeatureHelpContext.Provider value={value}>
      {children}
      {active && step && tour && (
        <CoachMarkOverlay
          step={step}
          stepIndex={active.stepIndex}
          stepCount={tour.steps.length}
          onAdvance={advance}
          onClose={close}
        />
      )}
    </FeatureHelpContext.Provider>
  );
}

export function useFeatureHelp() {
  const ctx = useContext(FeatureHelpContext);
  if (!ctx) {
    throw new Error("useFeatureHelp must be used within FeatureHelpProvider");
  }
  return ctx;
}
