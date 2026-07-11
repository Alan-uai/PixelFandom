'use client';

import {
  motion,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
  animate,
} from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import './elastic-slider-3d.css';

const MAX_OVERFLOW = 50;
const MAX_TILT = 20;

export interface ElasticSlider3DProps {
  defaultValue?: number;
  startingValue?: number;
  maxValue?: number;
  className?: string;
  isStepped?: boolean;
  stepSize?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  orientation?: 'horizontal' | 'vertical';
  onValueChange?: (value: number) => void;
}

export function ElasticSlider3D({
  defaultValue = 50,
  startingValue = 0,
  maxValue = 100,
  className = '',
  isStepped = false,
  stepSize = 1,
  leftIcon = <Minus className="elastic-slider-3d-icon" />,
  rightIcon = <Plus className="elastic-slider-3d-icon" />,
  label = '',
  showValue = true,
  valuePrefix = '',
  valueSuffix = '',
  orientation = 'horizontal',
  onValueChange,
}: ElasticSlider3DProps) {
  return (
    <div className={cn('elastic-slider-3d', className)}>
      {label && <span className="elastic-slider-3d-label">{label}</span>}
      <Slider
        defaultValue={defaultValue}
        startingValue={startingValue}
        maxValue={maxValue}
        isStepped={isStepped}
        stepSize={stepSize}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        showValue={showValue}
        valuePrefix={valuePrefix}
        valueSuffix={valueSuffix}
        orientation={orientation}
        onValueChange={onValueChange}
      />
    </div>
  );
}

function Slider({
  defaultValue,
  startingValue,
  maxValue,
  isStepped,
  stepSize,
  leftIcon,
  rightIcon,
  showValue,
  valuePrefix,
  valueSuffix,
  orientation,
  onValueChange,
}: {
  defaultValue: number;
  startingValue: number;
  maxValue: number;
  isStepped: boolean;
  stepSize: number;
  leftIcon: React.ReactNode;
  rightIcon: React.ReactNode;
  showValue: boolean;
  valuePrefix: string;
  valueSuffix: string;
  orientation: string;
  onValueChange?: (value: number) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [region, setRegion] = useState<'left' | 'right' | 'middle'>('middle');
  const clientX = useMotionValue(0);
  const clientY = useMotionValue(0);
  const overflow = useMotionValue(0);
  const scale = useMotionValue(1);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef(0);
  const isHorizontal = orientation === 'horizontal';
  const valueBlur = useTransform(
    overflow,
    [0, MAX_OVERFLOW],
    ['blur(0px)', 'blur(2px)'],
  );

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useMotionValueEvent(clientX, 'change', (latest) => {
    if (!sliderRef.current) return;
    const { left, right } = sliderRef.current.getBoundingClientRect();
    let newValue: number;

    if (latest < left) {
      setRegion('left');
      newValue = left - latest;
    } else if (latest > right) {
      setRegion('right');
      newValue = latest - right;
    } else {
      setRegion('middle');
      newValue = 0;
    }

    overflow.jump(decay(newValue, MAX_OVERFLOW));
  });

  const calculateValue = useCallback(
    (clientPos: number) => {
      if (!sliderRef.current) return startingValue;
      const rect = sliderRef.current.getBoundingClientRect();
      const pos = isHorizontal ? clientPos - rect.left : clientPos - rect.top;
      const size = isHorizontal ? rect.width : rect.height;
      let newValue = startingValue + (pos / size) * (maxValue - startingValue);

      if (isStepped) {
        newValue = Math.round(newValue / stepSize) * stepSize;
      }

      return Math.min(Math.max(newValue, startingValue), maxValue);
    },
    [startingValue, maxValue, isStepped, stepSize, isHorizontal],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.buttons > 0 && sliderRef.current) {
        const newValue = calculateValue(isHorizontal ? e.clientX : e.clientY);
        setValue(newValue);
        onValueChange?.(newValue);
        clientX.jump(e.clientX);
        clientY.jump(e.clientY);

        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const rawTiltX = ((e.clientY - cy) / rect.height) * -8;
          const rawTiltY = ((e.clientX - cx) / rect.width) * 8;
          tiltX.jump(Math.min(Math.max(rawTiltX, -MAX_TILT), MAX_TILT));
          tiltY.jump(Math.min(Math.max(rawTiltY, -MAX_TILT), MAX_TILT));
        }
      }
    },
    [calculateValue, isHorizontal, clientX, clientY, onValueChange, tiltX, tiltY],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      handlePointerMove(e);
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = 1;
      animate(scale, 1.15, { type: 'spring', stiffness: 300, damping: 20 });
    },
    [handlePointerMove, scale],
  );

  const handlePointerUp = useCallback(() => {
    animate(overflow, 0, { type: 'spring', bounce: 0.5 });
    animate(tiltX, 0, { type: 'spring', stiffness: 200, damping: 25 });
    animate(tiltY, 0, { type: 'spring', stiffness: 200, damping: 25 });
    animate(scale, 1, { type: 'spring', stiffness: 300, damping: 20 });
    dragRef.current = 0;
  }, [overflow, tiltX, tiltY, scale]);

  const getRangePercentage = () => {
    const totalRange = maxValue - startingValue;
    if (totalRange === 0) return 0;
    return ((value - startingValue) / totalRange) * 100;
  };

  const handleHoverStart = () => {
    if (dragRef.current === 0) {
      animate(scale, 1.15, { type: 'spring', stiffness: 300, damping: 20 });
    }
  };

  const handleHoverEnd = () => {
    if (dragRef.current === 0) {
      animate(scale, 1, { type: 'spring', stiffness: 300, damping: 20 });
    }
  };

  const handleContainerPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragRef.current === 0 && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const rawTiltX = ((e.clientY - cy) / rect.height) * -4;
        const rawTiltY = ((e.clientX - cx) / rect.width) * 4;
        tiltX.set(Math.min(Math.max(rawTiltX, -MAX_TILT), MAX_TILT));
        tiltY.set(Math.min(Math.max(rawTiltY, -MAX_TILT), MAX_TILT));
      }
    },
    [tiltX, tiltY],
  );

  const handleContainerLeave = useCallback(() => {
    if (dragRef.current === 0) {
      animate(tiltX, 0, { type: 'spring', stiffness: 200, damping: 25 });
      animate(tiltY, 0, { type: 'spring', stiffness: 200, damping: 25 });
    }
  }, [tiltX, tiltY]);

  const rangeWidth = getRangePercentage();
  const glowX = useTransform(() => {
    if (isHorizontal) return `${rangeWidth}%`;
    return '50%';
  });

  return (
    <motion.div
      ref={containerRef}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      onPointerMove={handleContainerPointerMove}
      onPointerLeave={handleContainerLeave}
      style={{
        scale,
        rotateX: tiltX,
        rotateY: tiltY,
        transformStyle: 'preserve-3d',
        perspective: 800,
        opacity: useTransform(scale, [1, 1.15], [0.8, 1]),
      }}
      className="elastic-slider-3d-wrapper"
    >
      <motion.div
        animate={{
          scale: region === 'left' ? [1, 1.35, 1] : 1,
          transition: { duration: 0.25 },
        }}
        style={{
          x: useTransform(() =>
            region === 'left' ? -overflow.get() / scale.get() : 0,
          ),
          transformStyle: 'preserve-3d',
        }}
      >
        {leftIcon}
      </motion.div>

      <div className="relative flex-1 max-w-[240px]">
        <motion.div
          className="elastic-slider-3d-glow"
          style={{
            opacity: useTransform(scale, [1, 1.15], [0, 0.8]),
            ['--glow-x' as string]: glowX,
          }}
        />
        <div
          ref={sliderRef}
          className="elastic-slider-3d-root"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onLostPointerCapture={handlePointerUp}
        >
          <motion.div
            style={{
              scaleX: useTransform(() => {
                if (sliderRef.current) {
                  const { width } = sliderRef.current.getBoundingClientRect();
                  return 1 + overflow.get() / width;
                }
                return 1;
              }),
              scaleY: useTransform(overflow, [0, MAX_OVERFLOW], [1, 0.75]),
              transformOrigin: useTransform(() => {
                if (sliderRef.current) {
                  const { left, width } = sliderRef.current.getBoundingClientRect();
                  return clientX.get() < left + width / 2 ? 'right' : 'left';
                }
                return 'center';
              }),
              height: useTransform(scale, [1, 1.15], [6, 12]),
            }}
            className="elastic-slider-3d-track-wrapper"
          >
            <div className="elastic-slider-3d-track">
              <div
                className="elastic-slider-3d-range"
                style={{ width: `${rangeWidth}%` }}
              />
            </div>
            <div
              className="elastic-slider-3d-handle"
              style={{ left: `${rangeWidth}%` }}
            />
          </motion.div>
        </div>
      </div>

      <motion.div
        animate={{
          scale: region === 'right' ? [1, 1.35, 1] : 1,
          transition: { duration: 0.25 },
        }}
        style={{
          x: useTransform(
            () => (region === 'right' ? overflow.get() / scale.get() : 0),
          ),
          transformStyle: 'preserve-3d',
        }}
      >
        {rightIcon}
      </motion.div>

      <motion.span
          className="elastic-slider-3d-value"
          style={{
            filter: valueBlur,
            opacity: showValue ? 1 : 0,
          }}
        >
          {valuePrefix}
          {Math.round(value)}
          {valueSuffix}
        </motion.span>
    </motion.div>
  );
}

function decay(value: number, max: number): number {
  if (max === 0) return 0;
  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
  return sigmoid * max;
}