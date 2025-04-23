import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps, toast } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      expand={false}
      closeButton
      richColors
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "hsl(142.1, 76.2%, 36.3%)",
          "--success-text": "hsl(120, 100%, 98%)",
          "--success-border": "hsl(147.8, 80.4%, 28.4%)",
          "--error-bg": "hsl(0, 84.2%, 60.2%)",
          "--error-text": "hsl(0, 0%, 98%)",
          "--error-border": "hsl(0, 72.2%, 50.6%)",
          "--accent-bg": "var(--accent)",
          "--accent-text": "var(--accent-foreground)",
          "--accent-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

// Only export the component from this file
export { Toaster, toast }
