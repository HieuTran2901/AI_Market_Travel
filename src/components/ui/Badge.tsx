import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  
  const variants = {
    default: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/20",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent dark:bg-slate-700/70 dark:text-slate-300 dark:hover:bg-slate-700",
    destructive: "bg-red-100 text-red-800 hover:bg-red-200 border-transparent dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/20",
    outline: "text-gray-950 border-gray-200 dark:border-slate-700 dark:text-slate-200",
    success: "bg-green-100 text-green-800 hover:bg-green-200 border-transparent dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/20",
    warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-transparent dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/20",
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
