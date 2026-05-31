'use client';

import { motion } from 'framer-motion';
import type { Variants, Transition } from 'framer-motion';
import type { ReactNode } from 'react';
import type { AnimationConfig, AnimationType, ChainMode } from './types';
import { buildAnimationClasses, shouldUseMotion } from '@/lib/block-styles';

interface MotionBlockWrapperProps {
  animation?: AnimationConfig;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
  as?: 'div' | 'section' | 'span';
}

function getMotionVariants(type: AnimationType): Variants {
  switch (type) {
    case 'fade-in':
      return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    case 'fade-in-left':
      return { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } };
    case 'fade-in-right':
      return { hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } };
    case 'fade-in-up':
      return { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
    case 'fade-in-down':
      return { hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } };
    case 'fade-in-scale':
      return { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } };
    case 'slide-up':
      return { hidden: { y: '100%' }, visible: { y: 0 } };
    case 'slide-down':
      return { hidden: { y: '-100%' }, visible: { y: 0 } };
    case 'slide-left':
      return { hidden: { x: '100%' }, visible: { x: 0 } };
    case 'slide-right':
      return { hidden: { x: '-100%' }, visible: { x: 0 } };
    case 'zoom-in':
      return { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } };
    case 'zoom-out':
      return { hidden: { opacity: 0, scale: 1.1 }, visible: { opacity: 1, scale: 1 } };
    case 'zoom-in-down':
      return { hidden: { opacity: 0, scale: 0.95, y: -20 }, visible: { opacity: 1, scale: 1, y: 0 } };
    case 'zoom-in-up':
      return { hidden: { opacity: 0, scale: 0.95, y: 20 }, visible: { opacity: 1, scale: 1, y: 0 } };
    case 'zoom-in-left':
      return { hidden: { opacity: 0, scale: 0.95, x: -20 }, visible: { opacity: 1, scale: 1, x: 0 } };
    case 'zoom-in-right':
      return { hidden: { opacity: 0, scale: 0.95, x: 20 }, visible: { opacity: 1, scale: 1, x: 0 } };
    case 'bounce-in':
      return {
        hidden: { opacity: 0, scale: 0.3 },
        visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 12 } as Transition },
      };
    case 'bounce-in-up':
      return {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 14 } as Transition },
      };
    case 'bounce-in-down':
      return {
        hidden: { opacity: 0, y: -40 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 14 } as Transition },
      };
    case 'bounce-in-left':
      return {
        hidden: { opacity: 0, x: -40 },
        visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 250, damping: 14 } as Transition },
      };
    case 'bounce-in-right':
      return {
        hidden: { opacity: 0, x: 40 },
        visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 250, damping: 14 } as Transition },
      };
    case 'flip-x-in':
      return { hidden: { opacity: 0, rotateX: 90 }, visible: { opacity: 1, rotateX: 0 } };
    case 'flip-y-in':
      return { hidden: { opacity: 0, rotateY: 90 }, visible: { opacity: 1, rotateY: 0 } };
    case 'perspective-up':
      return { hidden: { opacity: 0, z: -200, rotateX: 30 }, visible: { opacity: 1, z: 0, rotateX: 0 } };
    case 'perspective-down':
      return { hidden: { opacity: 0, z: -200, rotateX: -30 }, visible: { opacity: 1, z: 0, rotateX: 0 } };
    case 'spring-up':
      return {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } as Transition },
      };
    case 'spring-down':
      return {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } as Transition },
      };
    case 'spring-in':
      return {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 250, damping: 18 } as Transition },
      };
    case 'reveal':
      return { hidden: { clipPath: 'inset(0 100% 0 0)' }, visible: { clipPath: 'inset(0 0% 0 0)' } };
    case 'blur-in':
      return { hidden: { opacity: 0, filter: 'blur(12px)' }, visible: { opacity: 1, filter: 'blur(0px)' } };
    case 'scale-up':
      return { hidden: { scale: 1 }, visible: { scale: 1.05 } };
    case 'scale-down':
      return { hidden: { scale: 1 }, visible: { scale: 0.95 } };
    default:
      return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  }
}

function getDurationMs(duration?: string): number {
  switch (duration) {
    case 'fast': return 0.2;
    case 'slow': return 0.8;
    default: return 0.5;
  }
}

function getTransition(anim: AnimationConfig): Transition {
  const duration = getDurationMs(anim.duration);
  const base: Record<string, unknown> = { duration };
  if (anim.easing === 'spring' || anim.easing === 'bounce') {
    base.type = 'spring';
    base.stiffness = anim.easing === 'spring' ? 200 : 150;
    base.damping = 20;
  }
  if (anim.delay && anim.delay !== 'none') {
    const delayMap = { short: 0.1, medium: 0.3, long: 0.6 };
    base.delay = delayMap[anim.delay as keyof typeof delayMap];
  }
  return base as Transition;
}

function getHoverVariants(effect: string) {
  switch (effect) {
    case 'scale': return { scale: 1.05 };
    case 'lift': return { y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' };
    case 'glow': return { boxShadow: '0 0 20px 6px rgba(75, 197, 255, 0.4)' };
    case 'tilt': return { rotateX: 5, rotateY: -5 };
    case 'rotate': return { rotate: 5 };
    default: return {};
  }
}

function getTapVariants(effect: string) {
  switch (effect) {
    case 'scale': return { scale: 0.95 };
    case 'ripple': return { scale: 0.98 };
    default: return {};
  }
}

function buildChainVariants(steps: AnimationConfig['steps'], mode?: ChainMode, staggerDelay?: number): Variants {
  if (!steps || steps.length === 0) return {};
  const transitions: Transition[] = [];

  if (mode === 'parallel') {
    return { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0 } } };
  }

  if (mode === 'stagger') {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: (staggerDelay || 100) / 1000 },
      },
    };
  }

  steps.forEach((step) => {
    const t = getTransition({ ...step, type: step.type });
    transitions.push(t);
  });

  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: transitions.reduce((sum, t) => sum + ((t as Record<string, unknown>).duration as number || 0.5), 0),
        ease: 'easeOut',
      },
    },
  };
}

interface MotionBlockElementProps {
  anim: AnimationConfig;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
  as?: 'div' | 'section' | 'span';
}

function MotionBlockElement({ anim, className, style, children, as }: MotionBlockElementProps) {
  const variants = anim.steps && anim.steps.length > 0
    ? buildChainVariants(anim.steps, anim.chainMode, anim.staggerDelay)
    : getMotionVariants(anim.type as AnimationType);
  const transition = anim.steps && anim.steps.length > 0
    ? undefined
    : getTransition(anim);
  const hoverVariants = anim.hoverEffect && anim.hoverEffect !== 'none' ? getHoverVariants(anim.hoverEffect) : undefined;
  const tapVariants = anim.tapEffect && anim.tapEffect !== 'none' ? getTapVariants(anim.tapEffect) : undefined;

  const motionProps = {
    className,
    style,
    initial: 'hidden' as const,
    whileInView: anim.animateOnScroll ? 'visible' : undefined,
    animate: anim.animateOnScroll ? undefined : 'visible',
    variants,
    transition,
    whileHover: hoverVariants,
    whileTap: tapVariants,
    viewport: { once: true, margin: '-50px' as const },
  };

  switch (as) {
    case 'section':
      return <motion.section {...motionProps}>{children}</motion.section>;
    case 'span':
      return <motion.span {...motionProps}>{children}</motion.span>;
    default:
      return <motion.div {...motionProps}>{children}</motion.div>;
  }
}

export function MotionBlockWrapper({ animation, className, style, children, as }: MotionBlockWrapperProps) {
  if (!animation || animation.type === 'none') {
    const Tag = as || 'div';
    return <Tag className={className} style={style}>{children}</Tag>;
  }

  const cssClasses = buildAnimationClasses(animation);
  const combinedClass = [className, cssClasses].filter(Boolean).join(' ');

  if (shouldUseMotion(animation)) {
    return (
      <MotionBlockElement anim={animation} className={combinedClass} style={style} as={as}>
        {children}
      </MotionBlockElement>
    );
  }

  const Tag = as || 'div';
  return <Tag className={combinedClass} style={style}>{children}</Tag>;
}
