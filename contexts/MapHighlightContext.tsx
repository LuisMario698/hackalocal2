import React, { createContext, useContext, useState, useCallback } from 'react';

interface MapHighlightContextType {
  highlightedReportId: string | null;
  setHighlightedReportId: (id: string | null) => void;
  clearHighlight: () => void;
}

const MapHighlightContext = createContext<MapHighlightContextType>({
  highlightedReportId: null,
  setHighlightedReportId: () => {},
  clearHighlight: () => {},
});

export function MapHighlightProvider({ children }: { children: React.ReactNode }) {
  const [highlightedReportId, setHighlightedReportId] = useState<string | null>(null);

  const clearHighlight = useCallback(() => {
    setHighlightedReportId(null);
  }, []);

  return (
    <MapHighlightContext.Provider
      value={{ highlightedReportId, setHighlightedReportId, clearHighlight }}
    >
      {children}
    </MapHighlightContext.Provider>
  );
}

export function useMapHighlight() {
  return useContext(MapHighlightContext);
}
