'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardConfig {
  name: string;
  brand: string;
  bg: string;
  textColor: string;
  label: string;
  value: string;
  hiddenNum: string;
  fullNum: string;
  chipBg: string;
}

const cards: CardConfig[] = [
  {
    name: 'Stripe',
    brand: 'Stripe',
    bg: '#635bff',
    textColor: '#fff',
    label: 'Holder',
    value: 'ALEX SMITH',
    hiddenNum: '**** 4242',
    fullNum: '5524 9910 4242',
    chipBg: 'rgba(255,255,255,0.2)',
  },
  {
    name: 'Wise',
    brand: 'Wise',
    bg: '#9bd86a',
    textColor: '#1a1a2e',
    label: 'Business',
    value: 'STUDIO LLC',
    hiddenNum: '**** 8810',
    fullNum: '9012 4432 8810',
    chipBg: 'rgba(0,0,0,0.1)',
  },
  {
    name: 'PayPal',
    brand: 'PayPal',
    bg: '#ffffff',
    textColor: '#003087',
    label: 'Email',
    value: 'hello@work.com',
    hiddenNum: '**** 0094',
    fullNum: '3312 0045 0094',
    chipBg: 'rgba(0,0,0,0.05)',
  },
];

interface CardProps {
  card: CardConfig;
  index: number;
  walletHovered: boolean;
  isHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

function CreditCard({ card, index, walletHovered, isHovered, onHoverStart, onHoverEnd }: CardProps) {
  const restY = [90, 65, 40][index];
  const hoverY = [15, 45, 75][index];
  const restRotate = 0;
  const hoverRotate = index === 0 ? -3 : index === 1 ? 2 : 0;
  const baseZ = [10, 20, 30][index];

  return (
    <motion.div
      className="absolute left-[10px] w-[260px] h-[140px] rounded-2xl px-[18px] py-[18px] select-none"
      style={{ background: card.bg, color: card.textColor }}
      initial={{ y: -100, opacity: 0 }}
      animate={{
        y: walletHovered ? hoverY : restY,
        opacity: 1,
        rotate: walletHovered ? hoverRotate : restRotate,
        zIndex: isHovered ? 100 : walletHovered ? baseZ + 50 : baseZ,
        scale: isHovered ? 1.05 : 1,
        boxShadow: isHovered
          ? '0 20px 60px rgba(0,0,0,0.35)'
          : walletHovered
            ? '0 10px 30px rgba(0,0,0,0.2)'
            : '0 -4px 15px rgba(0,0,0,0.1)',
      }}
      transition={{
        type: 'spring',
        stiffness: 280,
        damping: 22,
        mass: 0.8,
        delay: isHovered ? 0 : walletHovered ? 0 : index * 0.08,
      }}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
    >
      <div className="flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <span className="text-sm uppercase tracking-wider font-medium">
            {card.name === 'PayPal' ? (
              <>
                Pay<b style={{ color: '#0079C1' }}>Pal</b>
              </>
            ) : (
              card.brand
            )}
          </span>
          <div
            className="w-8 h-6 rounded border border-white/10"
            style={{ background: card.chipBg }}
          />
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-[8px] uppercase opacity-70 block mb-0.5">{card.label}</span>
            <span className="text-[10px] font-medium">{card.value}</span>
          </div>
          <div className="text-right">
            <AnimatePresence mode="wait">
              {isHovered ? (
                <motion.span
                  key="full"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-sm font-mono tracking-wide"
                >
                  {card.fullNum}
                </motion.span>
              ) : (
                <motion.span
                  key="hidden"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-base tracking-wider"
                >
                  {card.hiddenNum}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="absolute inset-0 transition-all duration-300"
      style={{
        opacity: open ? 1 : 0,
        transform: `scale(${open ? 1.1 : 0.5})`,
        color: '#3be60b',
      }}
    >
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
          <line x1="3" y1="3" x2="21" y2="21" />
        </>
      )}
    </svg>
  );
}

function PocketSvg() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 160" fill="none" preserveAspectRatio="none">
      <path
        d="M 0 20 C 0 10, 5 10, 10 10 C 20 10, 25 25, 40 25 L 240 25 C 255 25, 260 10, 270 10 C 275 10, 280 10, 280 20 L 280 120 C 280 155, 260 160, 240 160 L 40 160 C 20 160, 0 155, 0 120 Z"
        fill="#1e341e"
      />
      <path
        d="M 8 22 C 8 16, 12 16, 15 16 C 23 16, 27 29, 40 29 L 240 29 C 253 29, 257 16, 265 16 C 268 16, 272 16, 272 22 L 272 120 C 272 150, 255 152, 240 152 L 40 152 C 25 152, 8 152, 8 120 Z"
        stroke="#3d5635"
        strokeWidth="1.5"
        strokeDasharray="6 4"
      />
    </svg>
  );
}

export default function CreditCardWallet({ className }: { className?: string }) {
  const [walletHovered, setWalletHovered] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div className={className}>
      <div
        className="relative w-[280px] h-[230px] cursor-pointer perspective-[1000px] flex items-end justify-center select-none"
        onMouseEnter={() => setWalletHovered(true)}
        onMouseLeave={() => { setWalletHovered(false); setHoveredCard(null); }}
        style={{
          transform: walletHovered ? 'translateY(-5px)' : 'translateY(0)',
          transition: 'transform 0.4s ease',
        }}
      >
        <div
          className="absolute bottom-0 w-[280px] h-[200px] bg-[#1e341e] rounded-[22px_22px_60px_60px]"
          style={{
            zIndex: 5,
            boxShadow: 'inset 0 25px 35px rgba(0,0,0,0.4), inset 0 5px 15px rgba(0,0,0,0.5)',
          }}
        />

        {cards.map((card, i) => (
          <CreditCard
            key={card.name}
            card={card}
            index={i}
            walletHovered={walletHovered}
            isHovered={hoveredCard === i}
            onHoverStart={() => setHoveredCard(i)}
            onHoverEnd={() => setHoveredCard(null)}
          />
        ))}

        <div
          className="absolute bottom-0 w-[280px] h-[160px] z-40 pointer-events-none"
          style={{ filter: 'drop-shadow(0 15px 25px rgba(20,40,20,0.4))' }}
        >
          <PocketSvg />

          <div className="absolute top-[45px] w-full text-center z-50 flex flex-col items-center gap-2">
            <div className="relative h-6 w-full flex items-center justify-center">
              <motion.span
                className="text-2xl tracking-widest absolute"
                style={{ color: '#839e7b' }}
                animate={{ opacity: walletHovered ? 0 : 1 }}
                transition={{ duration: 0.25 }}
              >
                ******
              </motion.span>
              <motion.span
                className="text-xl font-semibold absolute"
                style={{ color: '#a7c59e' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: walletHovered ? 1 : 0, y: walletHovered ? 0 : 10 }}
                transition={{ duration: 0.25 }}
              >
                $12,450.00
              </motion.span>
            </div>
            <div style={{ color: '#698263', fontSize: 12, fontWeight: 500 }}>Total Balance</div>
            <div
              className="relative h-5 w-5"
              style={{ opacity: walletHovered ? 1 : 0.3, transition: 'opacity 0.3s' }}
            >
              <EyeIcon open={walletHovered} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { CardConfig };
