'use client';

import { useState } from 'react';
import { Rabbit } from 'lucide-react';

export function ErrorMazeBlock({ config }: { config: Record<string, unknown> }) {
  const size = (config.size as number) || 8;


  const gridSize = Math.min(Math.max(size, 5), 12);
  const cellSize = Math.floor(400 / gridSize);

  const generateMaze = (n: number) => {
    const maze: number[][] = Array.from({ length: n * 2 + 1 }, () =>
      Array(n * 2 + 1).fill(1)
    );
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        maze[y * 2 + 1][x * 2 + 1] = 0;
      }
    }
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (y < n - 1 && Math.random() > 0.4) maze[y * 2 + 2][x * 2 + 1] = 0;
        if (x < n - 1 && Math.random() > 0.4) maze[y * 2 + 1][x * 2 + 2] = 0;
      }
    }
    maze[maze.length - 2][maze[0].length - 1] = 0;
    return maze;
  };

  const [maze] = useState(() => generateMaze(gridSize));
  const [pos, setPos] = useState({ x: 1, y: 1 });
  const [won, setWon] = useState(false);

  const move = (dx: number, dy: number) => {
    if (won) return;
    const nx = pos.x + dx;
    const ny = pos.y + dy;
    if (ny < 0 || ny >= maze.length || nx < 0 || nx >= maze[0].length) return;
    if (maze[ny][nx] === 1) return;
    setPos({ x: nx, y: ny });
    if (ny === maze.length - 2 && nx === maze[0].length - 1) setWon(true);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="flex items-center gap-2">
        <Rabbit className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium">Labirinto</span>
      </div>
      <div
        className="grid border bg-card rounded-lg overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${maze[0].length}, ${cellSize}px)`,
        }}
      >
        {maze.flatMap((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${y}-${x}`}
              className="transition-colors"
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: cell === 1 ? 'var(--border)' : 'transparent',
              }}
            >
              {pos.x === x && pos.y === y && !won && (
                <div className="w-full h-full bg-primary rounded-full scale-75" />
              )}
              {won && y === maze.length - 2 && x === maze[0].length - 1 && (
                <div className="w-full h-full bg-green-500 rounded-full scale-75" />
              )}
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        {[
          { label: '↑', dx: 0, dy: -1 },
          { label: '↓', dx: 0, dy: 1 },
          { label: '←', dx: -1, dy: 0 },
          { label: '→', dx: 1, dy: 0 },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={() => move(btn.dx, btn.dy)}
            className="w-10 h-10 rounded-lg border bg-card text-sm font-bold hover:border-primary transition-colors"
          >
            {btn.label}
          </button>
        ))}
      </div>
      {won && <p className="text-sm text-green-400 font-medium">Você escapou do labirinto!</p>}
    </div>
  );
}
