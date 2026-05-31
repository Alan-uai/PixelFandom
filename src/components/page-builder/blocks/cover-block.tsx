'use client';

const heightMap: Record<string, string> = {
  sm: 'h-[200px]',
  md: 'h-[300px]',
  lg: 'h-[400px]',
  full: 'min-h-screen',
};

const alignMap: Record<string, string> = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
};

export function CoverBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || '';
  const subtitle = config.subtitle as string | undefined;
  const backgroundImage = config.backgroundImage as string | undefined;
  const overlay = config.overlay !== false;
  const overlayColor = (config.overlayColor as string) || 'rgba(0,0,0,0.5)';
  const height = (config.height as string) || 'md';
  const textAlign = (config.textAlign as string) || 'center';

  return (
    <section
      className={`relative flex flex-col justify-center rounded-xl overflow-hidden px-6 py-12 ${heightMap[height] || 'h-[300px]'} ${alignMap[textAlign] || 'items-center text-center'}`}
      style={
        backgroundImage
          ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: 'linear-gradient(135deg, hsl(var(--primary)/0.1), hsl(var(--primary)/0.05))' }
      }
    >
      {backgroundImage && overlay && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: overlayColor }}
        />
      )}
      <div className="relative z-10 max-w-2xl">
        {title && <h2 className="text-3xl font-bold tracking-tight text-white">{title}</h2>}
        {subtitle && (
          <p className="mt-2 text-lg text-white/80">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
