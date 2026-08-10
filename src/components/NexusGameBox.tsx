import React from 'react';

export default function NexusGameBox() {
  return (
    <div className="w-full h-full flex flex-col bg-[var(--surface)]">
      <iframe
        src="https://benevolent-starburst-654d59.netlify.app/#/"
        className="w-full h-full flex-1 border-none"
        title="Nexus Game Box"
        allow="fullscreen; autoplay; gamepad; keyboard-map"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
