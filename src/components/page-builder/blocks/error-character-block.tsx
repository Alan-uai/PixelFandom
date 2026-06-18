'use client';



const characterEmoji: Record<string, string> = {
  'sad-robot': '🤖',
  'ghost': '👻',
  'alien': '👽',
  'cat': '🐱',
  'dog': '🐶',
  'owl': '🦉',
};

const moodClass: Record<string, string> = {
  sad: 'opacity-80 scale-95',
  happy: 'scale-110',
  confused: 'rotate-12',
  wink: 'rotate-6',
};

export function ErrorCharacterBlock({ config }: { config: Record<string, unknown> }) {
  const character = (config.character as string) || 'sad-robot';
  const mood = (config.mood as string) || 'sad';
  const animation = (config.animation as string) || 'float-error';
  const speech = (config.speech as string) || 'Oops! Parece que você se perdeu...';
  const showBubble = config.showBubble !== false;

  const emoji = characterEmoji[character] || '🤖';
  const moodCls = moodClass[mood] || '';

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className={`relative text-7xl ${moodCls} ${animation ? `animate-${animation}` : ''}`}>
        {emoji}
      </div>
      {showBubble && speech && (
        <div className="relative rounded-xl border bg-card px-6 py-4 max-w-xs text-center">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-l border-t bg-card" />
          <p className="text-sm text-foreground/90">{speech}</p>
        </div>
      )}
    </div>
  );
}
