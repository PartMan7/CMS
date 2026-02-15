'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { type AccentName, DEFAULT_ACCENT, getStoredAccent, setStoredAccent, applyAccent } from '@/lib/accents';

interface AccentContextValue {
	accent: AccentName;
	setAccent: (accent: AccentName) => void;
}

const AccentContext = createContext<AccentContextValue>({
	accent: DEFAULT_ACCENT,
	setAccent: () => {},
});

export function useAccent() {
	return useContext(AccentContext);
}

export function AccentProvider({ children }: { children: React.ReactNode }) {
	const [accent, setAccentState] = useState<AccentName>(() => getStoredAccent() ?? DEFAULT_ACCENT);

	// Apply accent CSS custom properties on mount
	useEffect(() => {
		applyAccent(getStoredAccent() ?? DEFAULT_ACCENT);
	}, []);

	const setAccent = useCallback((next: AccentName) => {
		setAccentState(next);
		setStoredAccent(next);
		applyAccent(next);
	}, []);

	return <AccentContext.Provider value={{ accent, setAccent }}>{children}</AccentContext.Provider>;
}
