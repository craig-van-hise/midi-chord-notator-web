import { useState, useEffect } from 'react';
import type { FilterMode } from './midiProcessing';

export function usePersistentState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    const [state, setState] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, state]);

    return [state, setState];
}

export const filterMode: FilterMode = 'block';
export const filterRange: [number, number] = [0, 127];

export const outputFilterMode: FilterMode = 'block';
export const outputFilterRange: [number, number] = [0, 127];

export function useFilterMode() {
    return usePersistentState<FilterMode>('midi_filter_mode', 'block');
}

export function useFilterRange() {
    return usePersistentState<[number, number]>('midi_filter_range', [0, 127]);
}
