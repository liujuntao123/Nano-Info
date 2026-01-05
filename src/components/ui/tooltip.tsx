import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  children: React.ReactNode
  content: string
  className?: string
}

export function Tooltip({ children, content, className }: TooltipProps) {
  return (
    <div className="relative inline-flex group/tooltip">
      {children}
      <div
        className={cn(
          "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs",
          "bg-popover text-popover-foreground rounded-md shadow-md border",
          "opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible",
          "transition-all duration-200 whitespace-nowrap z-50",
          "max-w-xs text-wrap",
          className
        )}
      >
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
      </div>
    </div>
  )
}
