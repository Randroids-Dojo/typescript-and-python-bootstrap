import * as React from 'react'
import { cn } from '@/lib/utils'

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

interface PasswordStrengthProps {
  password: string
  className?: string
}

export function PasswordStrengthMeter({ password, className }: PasswordStrengthProps) {
  const [strength, setStrength] = React.useState<PasswordStrength>('weak')
  const [, setScore] = React.useState(0)

  React.useEffect(() => {
    if (!password) {
      setStrength('weak')
      setScore(0)
      return
    }

    // Check length
    let currentScore = 0
    if (password.length >= 8) currentScore += 1
    if (password.length >= 12) currentScore += 1

    // Check complexity
    if (/[A-Z]/.test(password)) currentScore += 1
    if (/[a-z]/.test(password)) currentScore += 1
    if (/[0-9]/.test(password)) currentScore += 1
    if (/[^A-Za-z0-9]/.test(password)) currentScore += 1

    // Determine strength based on score
    let currentStrength: PasswordStrength = 'weak'
    if (currentScore >= 3) currentStrength = 'fair'
    if (currentScore >= 4) currentStrength = 'good'
    if (currentScore >= 5) currentStrength = 'strong'

    setScore(currentScore)
    setStrength(currentStrength)
  }, [password])

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <div 
          className={cn(
            'transition-all duration-300 ease-in-out h-full',
            {
              'bg-destructive/70 w-1/4': strength === 'weak',
              'bg-amber-500 w-2/4': strength === 'fair',
              'bg-amber-600 w-3/4': strength === 'good',
              'bg-emerald-600 w-full': strength === 'strong',
            }
          )} 
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className={cn('transition-colors', 
          strength === 'weak' ? 'text-destructive font-medium' : 'text-muted-foreground'
        )}>
          Weak
        </span>
        <span className={cn('transition-colors', 
          strength === 'fair' ? 'text-amber-500 font-medium' : 'text-muted-foreground'
        )}>
          Fair
        </span>
        <span className={cn('transition-colors', 
          strength === 'good' ? 'text-amber-600 font-medium' : 'text-muted-foreground'
        )}>
          Good
        </span>
        <span className={cn('transition-colors', 
          strength === 'strong' ? 'text-emerald-600 font-medium' : 'text-muted-foreground'
        )}>
          Strong
        </span>
      </div>
    </div>
  )
}