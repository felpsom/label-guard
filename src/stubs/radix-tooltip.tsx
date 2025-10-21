import * as React from "react"

// Radix Tooltip stub to avoid invalid hook calls; provides minimal API surface
// Exports: Provider, Root, Trigger, Content compatible with `* as TooltipPrimitive`

export const Provider: React.FC<{ children?: React.ReactNode } & { delayDuration?: number }> = ({ children }) => (
  <>{children}</>
)

export const Root: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>{children}</>
)

export const Trigger = React.forwardRef<
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
Trigger.displayName = "Trigger"

export const Content = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number }
>(({ children, className = "", ...props }, ref) => (
  <div
    ref={ref}
    role="tooltip"
    className={`z-[60] rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md ${className}`}
    {...props}
  >
    {children}
  </div>
))
Content.displayName = "Content"
