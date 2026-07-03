import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  
  const variants = {
    default: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent",
    destructive: "bg-red-100 text-red-800 hover:bg-red-200 border-transparent",
    outline: "text-gray-950 border-gray-200",
    success: "bg-green-100 text-green-800 hover:bg-green-200 border-transparent",
    warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-transparent",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
