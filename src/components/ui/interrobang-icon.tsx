import * as React from "react"

import { cn } from "@/lib/utils"

function InterrobangIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-3 w-3", className)}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
      <path d="M11 10.5c.5-1 1.5-1.5 2.5-1.5s2 .5 2 1.5c0 1-1 1.5-2 2" />
      <path d="M9.5 10.5c0-1.5 1.5-2.5 3-2.5" />
      <path d="M9 14.5h6" />
    </svg>
  )
}

export { InterrobangIcon }
