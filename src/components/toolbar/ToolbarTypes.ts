export type ButtonId = 'SEMI_UP' | 'SEMI_DOWN' | 'KEYSTEP_UP' | 'KEYSTEP_DOWN' | 'OCT_UP' | 'OCT_DOWN' | 'ROT_UP' | 'ROT_DOWN' | 'PLAY' | 'HOME' | 'UNDO' | 'REDO';
export interface ButtonConfig { stepSize: number; midiChannel: number; midiNote: number; }
export type ButtonConfigMap = Record<ButtonId, ButtonConfig>;
export interface GlobalSettings { listenMode: boolean; } 
export type ContextMenuType = { type: 'BUTTON'; x: number; y: number; buttonId: ButtonId } | { type: 'GLOBAL'; x: number; y: number } | null;
export interface LearnState { isActive: boolean; currentButtonIndex: number; sequence: ButtonId[]; }
