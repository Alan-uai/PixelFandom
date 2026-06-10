'use client'

const TEXT = 'PixelFandom'

const GRADIENT_COLORS = [
  'hsl(198,100%,65%)',
  'hsl(270,80%,60%)',
  'hsl(350,90%,60%)',
  'hsl(198,100%,65%)',
  'hsl(270,80%,60%)',
]



interface SplashSVGTextProps {
  visible?: boolean
}

export default function SplashSVGText({ visible: forceVisible }: SplashSVGTextProps) {
  const visible = forceVisible ?? true
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

      </defs>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        paintOrder="stroke"
        stroke="url(#splashStrokeGrad)"
        strokeWidth="8"
        strokeLinejoin="round"
        fill="transparent"
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
