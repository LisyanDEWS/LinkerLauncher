import React from 'react';
import { motion } from 'motion/react';

interface SquashToggleProps {
  checked: boolean;
  onChange: () => void;
  color?: string;
}

export default function SquashToggle({ checked, onChange, color = 'var(--accent)' }: SquashToggleProps) {
  return (
    <label className="squash-toggle-container group" onClick={(e) => e.stopPropagation()}>
      <input 
        type="checkbox" 
        className="squash-toggle-input" 
        checked={checked} 
        onChange={onChange} 
      />
      <div 
        className="squash-toggle-track"
        style={{ 
          backgroundColor: checked ? color : 'var(--container-high)',
          borderColor: checked ? color : 'var(--outline)'
        }}
      >
        <div className="squash-toggle-thumb bg-white dark:bg-[var(--on-surface-var)]">
          <div className="squash-thumb-icon" style={{ backgroundColor: checked ? color : 'transparent' }}></div>
        </div>
      </div>
    </label>
  );
}
