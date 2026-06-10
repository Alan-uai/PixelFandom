'use client'

const TEXT = 'PixelFandom'

const GRADIENT_COLORS = [
  'hsl(198,100%,65%)',
  'hsl(270,80%,60%)',
  'hsl(350,90%,60%)',
  'hsl(198,100%,65%)',
  'hsl(270,80%,60%)',
]

const FILL_STOPS = [
  { offset: 0, color: 'hsl(198,100%,65%)' },
  { offset: 50, color: 'hsl(270,80%,60%)' },
  { offset: 100, color: 'hsl(350,90%,60%)' },
]

interface SplashSVGTextProps {
  showBorder: boolean
  visible?: boolean
}

export default function SplashSVGText({ showBorder, visible: forceVisible }: SplashSVGTextProps) {
  const visible = forceVisible ?? showBorder
  return (
    <svg
      viewBox="0 0 600 100"
      className="w-full max-w-[650px] h-auto overflow-visible"
      role="img"
      aria-label="PixelFandom"
    >
      <defs>
        <linearGradient
          id="splashStrokeGrad"
          gradientUnits="userSpaceOnUse"
          x1="0" y1="0" x2="600" y2="0"
        >
          <animateTransform
            attributeName="gradientTransform"
            type="rotate"
            from="0 300 50"
            to="360 300 50"
            dur="3s"
            repeatCount="indefinite"
          />
          {GRADIENT_COLORS.map((color, i) => (
            <stop key={i} offset={`${(i / GRADIENT_COLORS.length) * 100}%`} stopColor={color} />
          ))}
        </linearGradient>
        <linearGradient id="splashFillGrad" x1="0" y1="0" x2="1" y2="1">
          {FILL_STOPS.map((s, i) => (
            <stop key={i} offset={`${s.offset}%`} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        paintOrder="stroke fill"
        stroke={showBorder ? 'url(#splashStrokeGrad)' : 'none'}
        strokeWidth="4"
        strokeLinejoin="round"
        fill="url(#splashFillGrad)"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize="96"
        letterSpacing="-0.025em"
      >
        {TEXT.split('').map((letter, i) => (
          <tspan
            key={i}
            style={{
              opacity: visible ? 1 : 0,
              transition: `opacity 0.6s ease ${i * 0.08}s`,
            }}
          >
            {letter}
          </tspan>
        ))}
      </text>
    </svg>
  )
}
