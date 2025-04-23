import { cva, type VariantProps } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg active:translate-y-0.5 active:shadow-sm",
        destructive:
          "bg-destructive text-white shadow-md hover:bg-destructive/90 hover:shadow-lg active:translate-y-0.5 active:shadow-sm focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/90 dark:hover:bg-destructive",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent/40 hover:text-accent-foreground hover:border-accent hover:shadow-md active:translate-y-0.5 active:shadow-xs dark:bg-input/10 dark:border-input/50 dark:hover:bg-input/20 dark:hover:border-accent",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md active:translate-y-0.5 active:shadow-xs dark:bg-secondary/90 dark:hover:bg-secondary",
        ghost:
          "text-foreground hover:bg-accent/30 hover:text-accent-foreground active:bg-accent/40 dark:text-foreground dark:hover:bg-accent/20",
        link: 
          "text-primary underline-offset-4 hover:underline hover:text-primary/80 p-0 h-auto shadow-none",
        soft:
          "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 dark:text-primary-foreground",
        accent: 
          "bg-accent text-accent-foreground shadow-md hover:bg-accent/90 hover:shadow-lg active:translate-y-0.5 active:shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-12 rounded-md px-6 has-[>svg]:px-5 text-base",
        xl: "h-14 rounded-lg px-8 has-[>svg]:px-6 text-lg",
        icon: "size-10 p-2",
        "icon-sm": "size-8 p-1.5 rounded-md",
        "icon-lg": "size-12 p-3 rounded-md",
      },
      fullWidth: {
        true: "w-full",
      },
      rounded: {
        true: "rounded-full",
        pill: "rounded-full",
        none: "rounded-none",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
    compoundVariants: [
      {
        size: "icon",
        class: "p-0",
      },
      {
        size: "icon-sm",
        class: "p-0",
      },
      {
        size: "icon-lg",
        class: "p-0",
      }
    ]
  }
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>