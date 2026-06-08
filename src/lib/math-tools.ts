import { create, all, type MathJsInstance } from 'mathjs'

let math: MathJsInstance | null = null

function getMath(): MathJsInstance {
  if (!math) {
    math = create(all)
    math.config({ number: 'number', precision: 10 })
  }
  return math
}

export interface MathResult {
  expression: string
  result: number | string
  error?: string
}

export function evaluateMath(expression: string, precision?: number): MathResult {
  const m = getMath()
  try {
    const result = m.evaluate(expression)
    const numResult = typeof result === 'number' ? result : Number(result)
    if (isNaN(numResult)) {
      return { expression, result: String(result) }
    }
    const p = precision ?? 4
    return {
      expression,
      result: +numResult.toFixed(p),
    }
  } catch (err) {
    return {
      expression,
      result: 'Error',
      error: `Falha ao calcular: ${(err as Error).message}`,
    }
  }
}
