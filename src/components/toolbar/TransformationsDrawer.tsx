import React, { useState, useEffect, useCallback } from 'react';
import { TransformationsToolbar } from './TransformationsToolbar';
import { ArrowContextMenu, GlobalContextMenu } from './TransformationsContextMenus';
import type { ButtonId, ButtonConfig, ButtonConfigMap, GlobalSettings, ContextMenuType, LearnState } from './TransformationsTypes';

const DEFAULT_CONFIG: ButtonConfig = {
  stepSize: 1,
  midiChannel: 1,
  midiNote: 60, // Middle C default
};

const INITIAL_BUTTONS: ButtonId[] = ['SEMI_DOWN', 'SEMI_UP', 'KEY_DOWN', 'KEY_UP', 'ROT_DOWN', 'ROT_UP', 'OCT_DOWN', 'OCT_UP', 'UNDO', 'REDO', 'PLAY', 'HOME'];

export const TransformationsDrawer = () => {
  // --- STATE ---
  const [pressed, setPressed] = useState<Record<ButtonId, boolean>>({} as any);
  
  // Initialize configs for all potential buttons
  const [configs, setConfigs] = useState<ButtonConfigMap>(() => {
    const map: any = {};
    INITIAL_BUTTONS.forEach(id => map[id] = { ...DEFAULT_CONFIG, midiNote: -1 });
    return map;
  });

  const [settings, setSettings] = useState<GlobalSettings>({
    listenMode: true,
  });

  const [contextMenu, setContextMenu] = useState<ContextMenuType>(null);
  
  const [learnState, setLearnState] = useState<LearnState>({
    isActive: false,
    currentButtonIndex: 0,
    sequence: [],
  });

  const activeMappedNoteRef = React.useRef<number>(-1);


  // --- HANDLERS: Buttons ---

  const handleButtonDown = (id: ButtonId, e?: React.PointerEvent) => {
    if (settings.listenMode && !learnState.isActive) {
      const config = configs[id];
      const stepSize = config?.stepSize || 1;

      // History Actions
      if (['UNDO', 'REDO', 'HOME'].includes(id)) {
        window.dispatchEvent(new CustomEvent('APP_HISTORY', {
          detail: { action: id as any }
        }));
      } 
      // Play Action
      else if (id === 'PLAY') {
        let velocity = 100;
        if (e) {
          const target = e.currentTarget as HTMLElement;
          if (target.releasePointerCapture) {
            target.releasePointerCapture(e.pointerId);
          }
          const rect = target.getBoundingClientRect();
          const offsetY = e.clientY - rect.top;
          // Bottom = 1, Top = 127
          velocity = Math.max(1, Math.min(127, Math.floor(((rect.height - offsetY) / rect.height) * 127)));
        }

        window.dispatchEvent(new CustomEvent('APP_PLAY', {
          detail: { velocity }
        }));
      }
      // Transform Actions
      else {
        window.dispatchEvent(new CustomEvent('APP_TRANSFORM', {
          detail: { type: id as any, stepSize }
        }));
      }
    }
    setPressed(prev => ({ ...prev, [id]: true }));
  };

  const handleButtonUp = (id: ButtonId) => {
    setPressed(prev => ({ ...prev, [id]: false }));
  };


  // --- HANDLERS: Context Menus ---

  const handleButtonContextMenu = (e: React.MouseEvent, id: ButtonId) => {
    e.preventDefault();
    e.stopPropagation(); // CRITICAL: Prevents bubbling to background handler
    
    if (learnState.isActive) return;

    const MENU_HEIGHT = 320;
    const MENU_WIDTH = 260;
    let y = e.clientY;
    let x = e.clientX;
    if (y + MENU_HEIGHT > window.innerHeight) y = window.innerHeight - MENU_HEIGHT - 20;
    if (x + MENU_WIDTH > window.innerWidth) x = window.innerWidth - MENU_WIDTH - 20;

    setContextMenu({
      type: 'BUTTON',
      x,
      y,
      buttonId: id
    });
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (learnState.isActive) return;

    const MENU_HEIGHT = 320;
    const MENU_WIDTH = 260;
    let y = e.clientY;
    let x = e.clientX;
    if (y + MENU_HEIGHT > window.innerHeight) y = window.innerHeight - MENU_HEIGHT - 20;
    if (x + MENU_WIDTH > window.innerWidth) x = window.innerWidth - MENU_WIDTH - 20;

    setContextMenu({
      type: 'GLOBAL',
      x,
      y
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  // --- LOGIC: Config Updates ---

  const updateButtonConfig = (id: ButtonId, updates: Partial<ButtonConfig>) => {
    setConfigs(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
  };

  const toggleListen = () => {
    setSettings(s => ({ ...s, listenMode: !s.listenMode }));
  };

  // --- LOGIC: MIDI Learn Mode ---

  const startLearnMode = () => {
    const sequence: ButtonId[] = [...INITIAL_BUTTONS];

    setLearnState({
      isActive: true,
      currentButtonIndex: 0,
      sequence: sequence
    });
    
    console.log("[Learn Mode] Started. Waiting for input for:", sequence[0]);
  };

  const stopLearnMode = useCallback(() => {
    if (!learnState.isActive) return;
    setLearnState(prev => ({ ...prev, isActive: false }));
    console.log("[Learn Mode] Cancelled/Finished.");
  }, [learnState.isActive]);





  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Start closed

  // Global click listener to close menus
  useEffect(() => {
    const handleClick = () => {
      // If menu is open, click outside closes it
      if (contextMenu) setContextMenu(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (contextMenu) setContextMenu(null);
        if (learnState.isActive) stopLearnMode();
      }

    };

    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu, learnState.isActive, stopLearnMode]);

  useEffect(() => {
    (window as any).__MIDI_INTERCEPTOR = (data: Uint8Array) => {
      const [status, note, velocity] = data;
      const isNoteOn = (status & 0xF0) === 0x90 && velocity > 0;
      const isNoteOff = (status & 0xF0) === 0x80 || ((status & 0xF0) === 0x90 && velocity === 0);
      
      // 1. LEARN MODE ACTIVE
      if (learnState.isActive) {
        if (isNoteOn) {
          const currentId = learnState.sequence[learnState.currentButtonIndex];
          updateButtonConfig(currentId, { midiNote: note });
          if (learnState.currentButtonIndex >= learnState.sequence.length - 1) {
            setLearnState(prev => ({ ...prev, isActive: false }));
          } else {
            setLearnState(prev => ({ ...prev, currentButtonIndex: prev.currentButtonIndex + 1 }));
          }
        }
        return true; // Unconditionally block both ON and OFF during learn
      }

      // 2. PLAY MODE (Action Mapping & Choke Group)
      const match = Object.keys(configs).find(id => configs[id as ButtonId].midiNote === note && note !== -1);
      
      if (match) {
        if (isNoteOn) {
          // CHOKE GROUP LOGIC: If a previous mapped note is ringing, kill it instantly.
          if (activeMappedNoteRef.current !== -1 && activeMappedNoteRef.current !== note) {
            const oldMatch = Object.keys(configs).find(id => configs[id as ButtonId].midiNote === activeMappedNoteRef.current);
            if (oldMatch) {
              handleButtonUp(oldMatch as ButtonId);
              window.dispatchEvent(new CustomEvent('APP_HARDWARE_PREVIEW_OFF'));
            }
          }
          
          // Track the new note and fire it
          activeMappedNoteRef.current = note;
          handleButtonDown(match as ButtonId);
          window.dispatchEvent(new CustomEvent('APP_HARDWARE_PREVIEW_ON', { detail: { velocity } }));
          
        } else if (isNoteOff) {
          // IGNORE ghost NoteOffs from choked keys. Only process if it matches the active note.
          if (activeMappedNoteRef.current === note) {
            handleButtonUp(match as ButtonId);
            window.dispatchEvent(new CustomEvent('APP_HARDWARE_PREVIEW_OFF'));
            activeMappedNoteRef.current = -1;
          }
        }
        return true; // Unconditionally consume all mapped notes (even ghost NoteOffs)
      }
      return false; // Let note pass to Canvas
    };

    return () => { (window as any).__MIDI_INTERCEPTOR = undefined; };
  }, [learnState, configs]);

  // --- LOGIC: Sync Configs to Interceptor ---
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('APP_CONFIG_UPDATE', {
      detail: { configs }
    }));
  }, [configs]);

  return (
    <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center pointer-events-none">
      <div className="pointer-events-auto w-full flex flex-col items-center">
      <div 
        className={`w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-10 flex flex-col items-center ${isDrawerOpen ? '-mt-10 translate-y-0' : '-mt-10 -translate-y-[170px]'}`}
      >
        <TransformationsToolbar 
          isOpen={isDrawerOpen}
          onToggleTab={() => setIsDrawerOpen(prev => !prev)}
          pressedButtons={pressed}
          configs={configs}
          learnModeTarget={learnState.isActive ? learnState.sequence[learnState.currentButtonIndex] : null}
          onButtonDown={handleButtonDown}
          onButtonUp={handleButtonUp}
          onButtonContextMenu={handleButtonContextMenu}
          onBackgroundContextMenu={handleBackgroundContextMenu}
        />
      </div>

      {/* Render Context Menus */}
      {contextMenu?.type === 'BUTTON' && (
        <ArrowContextMenu 
          buttonId={contextMenu.buttonId}
          config={configs[contextMenu.buttonId]}
          onUpdateConfig={updateButtonConfig}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={closeContextMenu}
        />
      )}

      {contextMenu?.type === 'GLOBAL' && (
        <GlobalContextMenu 
          settings={settings}
          onToggleListen={toggleListen}
          onLearnStart={startLearnMode}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={closeContextMenu}
        />
      )}

      {/* Learn Mode Overlay Instruction */}
      {learnState.isActive && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] z-50">
          <p className="font-bold text-center">LEARN MODE ACTIVE</p>
          <p className="text-xs text-center mt-1 text-gray-300">Play a MIDI note to map: <span className="text-yellow-400 font-bold text-lg">{learnState.sequence[learnState.currentButtonIndex]}</span></p>
          <button onClick={stopLearnMode} className="block w-full text-xs underline mt-2 hover:text-yellow-400">Cancel</button>
        </div>
      )}
      </div>
    </div>
  );
};
