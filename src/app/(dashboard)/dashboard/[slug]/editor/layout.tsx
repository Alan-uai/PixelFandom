import React from 'react'
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 min-w-0">{children}</div>;
}
