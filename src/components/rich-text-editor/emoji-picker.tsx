import { useEffect, useRef, useState } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useTheme } from '../../providers/theme-provider';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClickOutside: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

export const EmojiPicker = ({ onEmojiSelect, onClickOutside, buttonRef }: EmojiPickerProps) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    // Calculate position based on button position
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4, // 4px gap (mt-1)
        right: window.innerWidth - rect.right,
      });
    }
  }, [buttonRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClickOutside]);

  const handleEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji.native);
  };

  return (
    <div 
      ref={pickerRef}
      className="fixed z-50 shadow-lg rounded-lg overflow-hidden"
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`,
      }}
    >
      <Picker
        data={data}
        onEmojiSelect={handleEmojiSelect}
        theme={theme}
        set="native"
        previewPosition="none"
        skinTonePosition="none"
        maxFrequentRows={2}
        perLine={8}
        emojiSize={24}
        emojiButtonSize={36}
      />
    </div>
  );
};
