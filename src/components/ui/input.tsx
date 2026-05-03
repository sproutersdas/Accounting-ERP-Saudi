import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export interface InputProps extends Omit<React.ComponentProps<"input">, 'size'> {
  icon?: LucideIcon
  size?: 'default' | 'sm'
}

function Input({ className, type, icon: Icon, size = 'default', ...props }: InputProps) {
  return (
    <div className="relative w-full group">
      {Icon && (
        <div className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors",
          size === 'sm' && "left-3"
        )}>
          <Icon className={cn("h-5 w-5", size === 'sm' && "h-4 w-4")} />
        </div>
      )}
      <InputPrimitive
        type={type}
        data-slot="input"
        className={cn(
          "flex w-full rounded-[24px] border border-slate-200 bg-white px-4 py-2 text-sm ring-offset-background transition-all outline-none placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm",
          size === 'default' && "h-12",
          size === 'sm' && "h-9 rounded-[16px] px-3 text-xs",
          Icon && (size === 'sm' ? "pl-9" : "pl-12"),
          className
        )}
        {...props}
      />
    </div>
  )
}

export { Input }
