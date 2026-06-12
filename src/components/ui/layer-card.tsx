import * as React from "react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface LayerCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  layer: "global" | "wiki"
}

const LayerCard = React.forwardRef<HTMLDivElement, LayerCardProps>(
  ({ className, layer, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        data-layer={layer}
        className={cn("ai-card", className)}
        {...props}
      >
        {children}
      </Card>
    )
  }
)
LayerCard.displayName = "LayerCard"

export { LayerCard }
export type { LayerCardProps }
