'use client';

import type { EmbedPayload } from './types';

function hexToRgb(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) || 114;
  const g = parseInt(c.substring(2, 4), 16) || 137;
  const b = parseInt(c.substring(4, 6), 16) || 218;
  return `${r} ${g} ${b}`;
}

function TimestampDisplay({ timestamp }: { timestamp: boolean | string | undefined }) {
  if (!timestamp) return null;
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return <p className="text-[11px] text-[#949ba4] mt-1">{dateStr}</p>;
}

export function EmbedPreview({ embed }: { embed?: EmbedPayload | null }) {
  if (!embed || (!embed.title && !embed.description && !embed.footer && !embed.author && !embed.image && !embed.thumbnail && !embed.fields?.length)) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        <p>Configure campos do embed para ver o preview</p>
      </div>
    );
  }

  const accentColor = embed.color ? hexToRgb(embed.color) : '114 137 218';

  return (
    <div
      className="rounded-md bg-[#2b2d31] max-w-[520px] overflow-hidden"
      style={{ borderLeft: `4px solid rgb(${accentColor})` }}
    >
      <div className="p-3 space-y-2">
        {embed.author && embed.author.name && (
          <div className="flex items-center gap-2">
            {embed.author.icon_url && (
              <img
                src={embed.author.icon_url}
                alt=""
                className="w-5 h-5 rounded-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <span className="text-[12px] font-medium text-[#dbdee1]">
              {embed.author.name}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            {embed.title && (
              <a
                href={embed.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[16px] font-semibold text-[#00a8fc] hover:underline leading-tight"
                onClick={(e) => !embed.url && e.preventDefault()}
              >
                {embed.title}
              </a>
            )}

            {embed.description && (
              <p className="text-[14px] text-[#dbdee1] whitespace-pre-wrap leading-[1.3]">
                {embed.description}
              </p>
            )}

            {embed.fields && embed.fields.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {embed.fields.map((f, i) => (
                  <div
                    key={i}
                    className={f.inline ? 'flex-1 min-w-[100px]' : 'w-full'}
                  >
                    <p className="text-[12px] font-medium text-[#dbdee1] mt-1">{f.name}</p>
                    <p className="text-[12px] text-[#dbdee1] whitespace-pre-wrap">{f.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {embed.thumbnail && embed.thumbnail.url && (
            <img
              src={embed.thumbnail.url}
              alt=""
              className="w-[60px] h-[60px] rounded-md object-cover shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>

        {embed.image && embed.image.url && (
          <img
            src={embed.image.url}
            alt=""
            className="w-full max-h-[300px] rounded-md object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        <TimestampDisplay timestamp={embed.timestamp} />

        {embed.footer && embed.footer.text && (
          <div className="flex items-center gap-2 mt-1">
            {embed.footer.icon_url && (
              <img
                src={embed.footer.icon_url}
                alt=""
                className="w-4 h-4 rounded-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <span className="text-[11px] text-[#949ba4]">{embed.footer.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
