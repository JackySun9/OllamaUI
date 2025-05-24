import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextType | null>(null)

const useTooltip = () => {
  const context = React.useContext(TooltipContext)
  if (!context) {
    throw new Error("Tooltip components must be used within TooltipProvider")
  }
  return context
}

const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = React.useState(false)
  
  return (
    <TooltipContext.Provider value={{ open, onOpenChange: setOpen }}>
      <div className="relative">
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, children, asChild = false, ...props }, ref) => {
  const [open, setOpen] = React.useState(false)
  
  const handleMouseEnter = () => setOpen(true)
  const handleMouseLeave = () => setOpen(false)
  
  if (asChild && React.isValidElement(children)) {
    const childProps = {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      'data-tooltip-open': open,
    }
    return React.cloneElement(children, childProps)
  }
  
  return (
    <div
      ref={ref}
      className={cn("cursor-pointer", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-tooltip-open={open}
      {...props}
    >
      {children}
    </div>
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const [isVisible, setIsVisible] = React.useState(false)
  
  React.useEffect(() => {
    const trigger = document.querySelector('[data-tooltip-open="true"]')
    setIsVisible(!!trigger)
  })
  
  if (!isVisible) return null
  
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 px-3 py-2 text-sm rounded-md shadow-md",
        "bg-popover text-popover-foreground border",
        "animate-in fade-in-0 zoom-in-95",
        "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
        className
      )}
      {...props}
    >
      {children}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover" />
    </div>
  )
})
TooltipContent.displayName = "TooltipContent"

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} 