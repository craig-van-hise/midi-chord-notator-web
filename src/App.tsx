import React, { useEffect } from 'react';
import { MIDIProvider, useMidi } from './midi/MIDIProvider';
import MidiPortSelector from './midi/MidiPortSelector';
import Keyboard, { updateKeyVisuals88 } from './components/Keyboard'; // Import updateKeyVisuals88
import NotationCanvas from './components/NotationCanvas';
import SettingsModal from './components/SettingsModal';
import InfoModal from './components/InfoModal';

// Component to handle MIDI message listening and keyboard updates
const MidiKeyboardUpdater: React.FC = () => {
  const { selectedInputPort } = useMidi(); // Get the selected input port

  useEffect(() => {
    // Handler for incoming MIDI messages
    const handleMidiMessage = (event: Event) => {
      const customEvent = event as CustomEvent<{ data: Uint8Array; timestamp: number; input: any; panic?: boolean }>;
      if (customEvent.detail?.panic) {
        // Clear all keys
        for (let i = 0; i < 128; i++) {
          updateKeyVisuals88(i, '');
        }
        return;
      }
      
      if (!customEvent.detail || !customEvent.detail.data) {
        console.warn('Received MIDI message with no data:', customEvent);
        return;
      }

      const [command, note, velocity] = customEvent.detail.data;

      // Note-on message: command is 144 (0x90) and velocity > 0
      // Note-off message: command is 128 (0x80) or 144 (0x90) with velocity 0
      const NOTE_ON_COMMAND = 0x90;
      const NOTE_OFF_COMMAND = 0x80;

      if (command === NOTE_ON_COMMAND && velocity > 0) {
        // Note-on event
        console.log(`Note On: ${note}, Velocity: ${velocity}`);
        updateKeyVisuals88(note, '#aa3bff'); // Light up with accent purple
      } else if (command === NOTE_OFF_COMMAND || (command === NOTE_ON_COMMAND && velocity === 0)) {
        // Note-off event
        console.log(`Note Off: ${note}`);
        updateKeyVisuals88(note, ''); // Reset color
      }
    };

    // Add the event listener
    window.addEventListener('MIDI_MESSAGE_RECEIVED', handleMidiMessage);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('MIDI_MESSAGE_RECEIVED', handleMidiMessage);
    };
  }, [selectedInputPort]); // Re-run effect if selectedInputPort changes, though the event is global

  // This component doesn't render anything itself, it just manages the side effect
  return null;
};


function App() {
  return (
    <MIDIProvider>
      <MidiKeyboardUpdater />
      <AppContent />
    </MIDIProvider>
  );
}

const AppContent: React.FC = () => {
  const { handleMidiPanic } = useMidi();
  const [isInfoModalOpen, setIsInfoModalOpen] = React.useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f8f7f2] dark:bg-[#0a0a0a]">
      {/* Ultra-Slim Header */}
      <header className="px-4 h-[42px] flex items-center justify-between z-20 border-b border-gray-200/50 dark:border-white/5">
        <div 
          className="font-bold tracking-tight whitespace-nowrap m-0 text-[#1a1a1a] dark:text-white self-center"
          style={{ fontSize: '1.125rem', lineHeight: '1' }}
        >
          MIDI Chord <span className="text-[#aa3bff]">Notator</span>
        </div>
        <div className="flex items-center gap-4">
          <MidiPortSelector />
          <div className="w-px h-3 bg-gray-200 dark:bg-white/10" />
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleMidiPanic}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
              title="MIDI Panic (All Notes Off)"
            >
              <span className="text-lg leading-none opacity-70 hover:opacity-100 font-bold text-red-500">!</span>
            </button>
            <button
              onClick={() => setIsInfoModalOpen(true)}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
              aria-label="Information"
            >
              <span className="text-lg leading-none opacity-70 hover:opacity-100 font-serif italic font-bold">i</span>
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
              aria-label="Settings"
            >
              <span className="text-lg leading-none grayscale opacity-70 hover:opacity-100">⚙️</span>
            </button>
          </div>
        </div>
      </header>

      {/* Focused Notation Workspace */}
      <main className="flex-1 relative flex flex-col items-center pt-8">
        <div className="w-full max-w-[800px] flex justify-center">
          <NotationCanvas />
        </div>
      </main>

      {/* Scaled Keyboard at the bottom */}
      <footer className="w-full pb-6 flex justify-center z-10">
        <div className="bg-white dark:bg-[#111] p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800">
          <Keyboard />
        </div>
      </footer>

      {/* Hoisted Modals */}
      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </div>
  );
};

export default App;