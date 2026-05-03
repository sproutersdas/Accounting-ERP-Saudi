import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  className
}: {
  options: { label: string; value: string }[];
  value: string;
  onValueChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-12 w-full justify-between overflow-hidden rounded-[20px] border-slate-200 bg-slate-50/30 px-6 font-bold text-slate-800 transition-all hover:bg-slate-50 hover:border-slate-300 shadow-sm", 
            className
          )}
        >
          <span className="truncate uppercase text-[10px] tracking-wide">
            {value
              ? options.find((option) => option.value === value)?.label || placeholder
              : placeholder}
          </span>
          <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 transition-transform duration-200 text-teal-600", open && "rotate-180")} />
        </Button>
      } />
      <PopoverContent className="w-[--radix-popover-trigger-width] p-2 overflow-hidden bg-white shadow-xl rounded-[20px] border border-slate-100 z-50 mt-2">
        <Command className="rounded-[16px]">
          <CommandInput 
            placeholder={`Search options...`} 
            className="h-10 text-xs border-teal-500/30 focus-within:border-teal-500 rounded-xl" 
          />
          <CommandList className="max-h-[300px] overflow-auto mt-2">
            <CommandEmpty className="py-6 text-center text-xs text-slate-400 italic">No options found</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                  className="text-[11px] font-bold uppercase tracking-tight py-2.5 px-4 cursor-pointer rounded-lg aria-selected:bg-teal-50 aria-selected:text-teal-700 transition-colors"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5 text-teal-600",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
