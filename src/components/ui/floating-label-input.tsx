import * as React from "react"

import { cn } from "@/lib/utils"
import { InterrobangIcon } from "@/components/ui/interrobang-icon"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface FloatingLabelInputProps
  extends React.ComponentProps<"input"> {
  label: string
  info?: React.ReactNode
  error?: string
  containerClassName?: string
}

const FloatingLabelInput = React.forwardRef<
  HTMLInputElement,
  FloatingLabelInputProps
>(
  (
    {
      className,
      containerClassName,
      label,
      info,
      error,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const errorId = `${inputId}-error`

    return (
      <div className={cn("relative", containerClassName)}>
        <div
          className={cn(
            "relative rounded-md border transition-colors",
            error
              ? "border-destructive"
              : "border-input focus-within:border-primary",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "peer w-full bg-transparent px-3 pb-2 pt-5 text-base outline-none placeholder:text-transparent disabled:cursor-not-allowed md:text-sm",
              className
            )}
            placeholder=" "
            {...props}
          />

          <label
            htmlFor={inputId}
            className={cn(
              "pointer-events-none absolute left-3 top-0 z-[1] -translate-y-1/2 bg-transparent px-1 text-xs backdrop-blur-[2px] transition-all",
              "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground",
              error
                ? "text-destructive"
                : "text-muted-foreground peer-focus:text-primary peer-not-placeholder-shown:text-primary",
              disabled && "opacity-50"
            )}
          >
            {label}
          </label>

          {info && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Informação"
                    className={cn(
                      "absolute right-2 top-0 z-[1] -translate-y-1/2 flex items-center justify-center",
                      "h-4 w-4 rounded-full bg-transparent backdrop-blur-[2px]",
                      "opacity-100 transition-opacity duration-200",
                      "md:opacity-0 md:peer-focus:opacity-100 md:peer-not-placeholder-shown:opacity-100",
                      "hover:text-foreground focus-visible:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      error ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    <InterrobangIcon />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="end"
                  className="max-w-[260px]"
                >
                  {info}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {error && (
            <p
              id={errorId}
              role="alert"
              className={cn(
                "pointer-events-none absolute bottom-0 left-3 z-[1] translate-y-1/2 bg-transparent px-1 text-xs text-destructive backdrop-blur-[2px]"
              )}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    )
  }
)
FloatingLabelInput.displayName = "FloatingLabelInput"

export { FloatingLabelInput }
export type { FloatingLabelInputProps }
