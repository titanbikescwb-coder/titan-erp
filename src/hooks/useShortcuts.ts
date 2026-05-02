import { useEffect } from 'react';

type ShortcutMap = {
  [key: string]: (event: KeyboardEvent) => void;
};

export function useShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for the key in shortcuts map
      const action = shortcuts[event.key];
      
      if (action) {
        // Only prevent default for F keys or specific known actions to avoid breaking standard shortcuts
        if (event.key.startsWith('F')) {
          event.preventDefault();
        }
        action(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
