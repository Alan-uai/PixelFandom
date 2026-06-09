'use client';

import { Loader2, X } from 'lucide-react';
import AnimatedBorder from '@/components/ui/animated-border';

interface SearchInputProps {
  value: string;
  onChange: (q: string) => void;
  placeholder?: string;
  loading?: boolean;
  showFilter?: boolean;
  onClear?: () => void;
}

const filterSvg = (
  <svg
    preserveAspectRatio="none"
    height="27"
    width="27"
    viewBox="4.8 4.56 14.832 15.408"
    fill="none"
  >
    <path
      d="M8.16 6.65002H15.83C16.47 6.65002 16.99 7.17002 16.99 7.81002V9.09002C16.99 9.56002 16.7 10.14 16.41 10.43L13.91 12.64C13.56 12.93 13.33 13.51 13.33 13.98V16.48C13.33 16.83 13.1 17.29 12.81 17.47L12 17.98C11.24 18.45 10.2 17.92 10.2 16.99V13.91C10.2 13.5 9.97 12.98 9.73 12.69L7.52 10.36C7.23 10.08 7 9.55002 7 9.20002V7.87002C7 7.17002 7.52 6.65002 8.16 6.65002Z"
      stroke="#d6d6e6"
      strokeWidth="1"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  loading = false,
  showFilter = true,
  onClear,
}: SearchInputProps) {
  const hasFilterIcon = loading || value.length > 0 || showFilter;

  return (
    <AnimatedBorder>
      <div id="main">
        <input
          placeholder={placeholder}
          type="text"
          name="text"
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div id="input-mask" />
        <div id="pink-mask" />
        {hasFilterIcon && <div className="filterBorder" />}
        <div id="filter-icon">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[#d6d6e6]" />
          ) : value.length > 0 ? (
            <button
              onClick={() => { onChange(''); onClear?.(); }}
              className="flex items-center justify-center w-full h-full"
            >
              <X className="h-5 w-5 text-[#d6d6e6]" />
            </button>
          ) : showFilter ? (
            filterSvg
          ) : null}
        </div>
        <div id="search-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            height="24"
            fill="none"
          >
            <circle stroke="url(#search)" r="8" cy="11" cx="11" />
            <line stroke="url(#searchl)" y2="16.65" y1="22" x2="16.65" x1="22" />
            <defs>
              <linearGradient gradientTransform="rotate(50)" id="search">
                <stop stopColor="#f8e7f8" offset="0%" />
                <stop stopColor="#b6a9b7" offset="50%" />
              </linearGradient>
              <linearGradient id="searchl">
                <stop stopColor="#b6a9b7" offset="0%" />
                <stop stopColor="#837484" offset="50%" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </AnimatedBorder>
  );
}
