import * as React from "react"

// Lightweight, safe tooltip stubs to avoid Radix dependency while fixing invalid hook calls
// These components render children directly without portals or React hook usage
// If you need full tooltips later, re-enable Radix here after resolving React duplication issues.

type ProviderProps = { children?: React.ReactNode }

const TooltipProvider: React.FC<ProviderProps> = ({ children }) => <>{children}</>

const Tooltip: React.FC<ProviderProps> = ({ children }) => <>{children}</>

const TooltipTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, { ref, ...props })
  }
  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} {...props}>
      {children}
    </span>
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { hidden?: boolean }
>(({ hidden, children, className = "", ...props }, ref) => {
  if (hidden) return null
  return (
    <div
      ref={ref}
      role="tooltip"
      className={`z-[60] rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
