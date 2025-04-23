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

// Password input with visibility toggle
type PasswordInputProps = Omit<InputProps, 'type'>;

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, icon, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    
    const togglePasswordVisibility = () => {
      setShowPassword(prev => !prev)
    }

    const visibilityIcon = (
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
        tabIndex={-1}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    )

    const passwordIcon = icon || (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    )

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        icon={passwordIcon}
        trailingAccessory={visibilityIcon}
        className={className}
        {...props}
      />
    )
  }
)

PasswordInput.displayName = "PasswordInput"

export { Input, PasswordInput }