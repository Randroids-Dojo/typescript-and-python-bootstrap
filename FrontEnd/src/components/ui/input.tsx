import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  trailingAccessory?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, iconPosition = 'left', trailingAccessory, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 flex items-center justify-center pointer-events-none text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-10 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-sm transition-all duration-200 outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            "hover:border-ring/50",
            icon && iconPosition === 'left' && "pl-10",
            icon && iconPosition === 'right' && "pr-10",
            trailingAccessory && "pr-12",
            className
          )}
          {...props}
        />
        {icon && iconPosition === 'right' && !trailingAccessory && (
          <div className="absolute right-3 flex items-center justify-center pointer-events-none text-muted-foreground">
            {icon}
          </div>
        )}
        {trailingAccessory && (
          <div className="absolute right-3 flex items-center justify-center">
            {trailingAccessory}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
