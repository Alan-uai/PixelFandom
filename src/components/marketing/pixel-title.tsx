'use client';

const GRADIENT_ID = 'pixel-title-grad';
const FILL_MASK_ID = 'pixel-title-fill-mask';
const ICON_CLIP_ID = 'pixel-title-icon-clip';

const TITLE = 'PixelFandom';
const VIEW_W = 1560;
const VIEW_H = 312;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const ICON_SIZE = 260;
const ICON_R = ICON_SIZE / 2;
const FONT_SIZE = 132;

export default function PixelTitle({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="PixelFandom"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(198,100%,65%)" />
            <stop offset="50%" stopColor="hsl(270,80%,60%)" />
            <stop offset="100%" stopColor="hsl(350,90%,60%)" />
          </linearGradient>

          <mask
            id={FILL_MASK_ID}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={VIEW_W}
            height={VIEW_H}
          >
            <rect width={VIEW_W} height={VIEW_H} fill="#ffffff" />
            <circle cx={CX} cy={CY} r={ICON_R} fill="#000000" />
          </mask>

          <clipPath id={ICON_CLIP_ID}>
            <circle cx={CX} cy={CY} r={ICON_R} />
          </clipPath>
        </defs>

        <image
          href="/icon.svg"
          x={CX - ICON_R}
          y={CY - ICON_R}
          width={ICON_SIZE}
          height={ICON_SIZE}
          preserveAspectRatio="xMidYMid meet"
        />

        <text
          x={CX}
          y={CY}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="'DotGothic16', sans-serif"
          fontSize={FONT_SIZE}
          fill={`url(#${GRADIENT_ID})`}
          mask={`url(#${FILL_MASK_ID})`}
        >
          {TITLE}
        </text>

        <g clipPath={`url(#${ICON_CLIP_ID})`}>
          <text
            x={CX}
            y={CY}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="'DotGothic16', sans-serif"
            fontSize={FONT_SIZE}
            fill="none"
            stroke={`url(#${GRADIENT_ID})`}
            strokeWidth="3"
            paintOrder="stroke"
          >
            {TITLE}
          </text>
        </g>

        <circle
          cx={CX}
          cy={CY}
          r={ICON_R}
          fill="none"
          stroke={`url(#${GRADIENT_ID})`}
          strokeOpacity="0.4"
          strokeWidth="1.5"
          strokeDasharray="7 11"
          opacity="0.45"
        />
      </svg>
    </div>
  );
}