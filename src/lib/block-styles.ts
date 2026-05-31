import type { BlockStyle, SpacingOption, BorderStyle, ShadowSize, TextAlign, AnimationType, VisibilityMode, AnimationConfig, DurationOption, DelayOption, EasingOption } from '@/components/page-builder/types';

const SPACING_MAP: Record<SpacingOption, string> = {
  none: '', sm: 'p-2', md: 'p-4', lg: 'p-6', xl: 'p-8',
};
const MARGIN_MAP: Record<SpacingOption, string> = {
  none: '', sm: 'mb-2', md: 'mb-4', lg: 'mb-6', xl: 'mb-8',
};
const BORDER_MAP: Record<BorderStyle, string> = {
  none: '', solid: 'border rounded-lg', bottom: 'border-b',
};
const SHADOW_MAP: Record<ShadowSize, string> = {
  none: '', sm: 'shadow-sm', md: 'shadow-md', lg: 'shadow-lg',
};
const TEXT_ALIGN_MAP: Record<TextAlign, string> = {
  left: 'text-left', center: 'text-center', right: 'text-right',
};
const VISIBILITY_MAP: Record<VisibilityMode, string> = {
  all: '', 'desktop-only': 'hidden md:block', 'mobile-only': 'block md:hidden',
};
const WIDTH_MAP: Record<string, string> = {
  full: 'w-full', contained: 'max-w-5xl mx-auto', auto: '',
};

const ANIMATION_MAP: Record<string, string> = {
  'fade-in': 'animate-fade-in',
  'fade-in-left': 'animate-fade-in-left',
  'fade-in-right': 'animate-fade-in-right',
  'fade-in-up': 'animate-fade-in-up',
  'fade-in-down': 'animate-fade-in-down',
  'fade-in-scale': 'animate-fade-in-scale',
  'slide-up': 'animate-slide-up',
  'slide-down': 'animate-slide-down',
  'slide-left': 'animate-slide-left',
  'slide-right': 'animate-slide-right',
  'zoom-in': 'animate-zoom-in',
  'zoom-out': 'animate-zoom-out',
  'zoom-in-down': 'animate-zoom-in-down',
  'zoom-in-up': 'animate-zoom-in-up',
  'zoom-in-left': 'animate-zoom-in-left',
  'zoom-in-right': 'animate-zoom-in-right',
  'bounce-in': 'animate-bounce-in',
  'bounce-in-up': 'animate-bounce-in-up',
  'bounce-in-down': 'animate-bounce-in-down',
  'bounce-in-left': 'animate-bounce-in-left',
  'bounce-in-right': 'animate-bounce-in-right',
  'flip-x': 'animate-flip-x',
  'flip-y': 'animate-flip-y',
  'flip-x-in': 'animate-flip-x-in',
  'flip-y-in': 'animate-flip-y-in',
  'perspective-up': 'animate-perspective-up',
  'perspective-down': 'animate-perspective-down',
  'three-d-tilt': 'animate-three-d-tilt',
  'card-flip': 'animate-card-flip',
  'pulse': 'animate-pulse',
  'pulse-soft': 'animate-pulse-soft',
  'shake': 'animate-shake',
  'shake-x': 'animate-shake-x',
  'swing': 'animate-swing',
  'wobble': 'animate-wobble',
  'jello': 'animate-jello',
  'glow': 'animate-glow',
  'float': 'animate-float',
  'bounce-loop': 'animate-bounce-loop',
  'ping-soft': 'animate-ping-soft',
  'heartbeat': 'animate-heartbeat',
  'reveal': 'animate-reveal',
  'blur-in': 'animate-blur-in',
  'mask-in': 'animate-mask-in',
  'scale-up': 'animate-scale-up',
  'scale-down': 'animate-scale-down',
  // Footer-specific
  'reveal-up': 'animate-reveal-up',
  'drop-in': 'animate-drop-in',
  'expand-in': 'animate-expand-in',
  'border-pulse': 'animate-border-pulse',
  'color-cycle': 'animate-color-cycle',
  'slide-up-blur': 'animate-slide-up-blur',
  'vibrate': 'animate-vibrate',
  'clip-in': 'animate-clip-in',
};

const DURATION_MAP: Record<DurationOption, string> = {
  fast: 'animate-duration-fast', normal: '', slow: 'animate-duration-slow',
};
const DELAY_MAP: Record<DelayOption, string> = {
  none: '', short: 'animate-delay-short', medium: 'animate-delay-medium', long: 'animate-delay-long',
};
const EASING_MAP: Record<EasingOption, string> = {
  ease: '', 'ease-out': '', 'ease-in': '', 'ease-in-out': '', bounce: 'animate-ease-bounce', spring: 'animate-ease-spring',
};

export function buildAnimationClasses(anim?: AnimationConfig): string {
  if (!anim || anim.type === 'none') return '';
  const classes: string[] = [];
  const baseClass = ANIMATION_MAP[anim.type];
  if (baseClass) classes.push(baseClass);
  if (anim.duration) { const d = DURATION_MAP[anim.duration]; if (d) classes.push(d); }
  if (anim.delay) { const d = DELAY_MAP[anim.delay]; if (d) classes.push(d); }
  if (anim.easing) { const e = EASING_MAP[anim.easing]; if (e) classes.push(e); }
  if (anim.iteration && anim.iteration !== 'once') {
    if (anim.iteration === 'infinite') classes.push('animate-iteration-infinite');
    else if (anim.iteration === 2) classes.push('animate-iteration-2');
    else if (anim.iteration === 3) classes.push('animate-iteration-3');
  }
  if (anim.perspective) classes.push('perspective-1000 preserve-3d');
  return classes.join(' ');
}

export function shouldUseMotion(anim?: AnimationConfig): boolean {
  if (!anim || anim.type === 'none') return false;
  if (anim.animateOnScroll) return true;
  if (anim.hoverEffect && anim.hoverEffect !== 'none') return true;
  if (anim.tapEffect && anim.tapEffect !== 'none') return true;
  if (anim.tiltOnHover) return true;
  if (anim.steps && anim.steps.length > 0) return true;
  const motionTypes: AnimationType[] = ['spring-up', 'spring-down', 'spring-in', 'reveal', 'blur-in', 'mask-in', 'spotlight', 'highlight', 'reveal-up', 'drop-in', 'slide-up-blur', 'clip-in'];
  if (motionTypes.includes(anim.type as AnimationType)) return true;
  return false;
}

export function buildBlockClasses(style?: BlockStyle): string {
  if (!style) return '';
  const classes: string[] = [];
  if (style.padding) classes.push(SPACING_MAP[style.padding]);
  if (style.margin) classes.push(MARGIN_MAP[style.margin]);
  if (style.border) classes.push(BORDER_MAP[style.border]);
  if (style.borderColor) classes.push(`border-${style.borderColor}`);
  if (style.shadow) classes.push(SHADOW_MAP[style.shadow]);
  if (style.textAlign) classes.push(TEXT_ALIGN_MAP[style.textAlign]);
  const animClasses = buildAnimationClasses(style.animation);
  if (animClasses) classes.push(animClasses);
  if (style.visibility) classes.push(VISIBILITY_MAP[style.visibility]);
  if (style.width) classes.push(WIDTH_MAP[style.width]);
  return classes.filter(Boolean).join(' ');
}

export function buildBlockStyle(style?: BlockStyle): React.CSSProperties {
  if (!style) return {};
  const css: React.CSSProperties = {};
  if (style.backgroundColor) css.backgroundColor = style.backgroundColor;
  return css;
}
