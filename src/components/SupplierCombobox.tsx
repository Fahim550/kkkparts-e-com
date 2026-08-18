import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"
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

interface SupplierComboboxProps {
  suppliers: any[]
  value: string
  onChange: (value: string) => void
}

export function SupplierCombobox({ suppliers, value, onChange }: SupplierComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const selected = suppliers?.find(s => s.id === value)
  const isNew = value.startsWith("NEW:")
  const displayValue = selected ? selected.name : (isNew ? value.substring(4) : "Select Supplier...")

  const showCreate = inputValue.length > 0 && !suppliers?.some(s => s.name.toLowerCase() === inputValue.toLowerCase())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background px-3 font-normal"
        >
          <span className="truncate">
            {displayValue}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search suppliers..." value={inputValue} onValueChange={setInputValue} />
          <CommandList>
            <CommandEmpty>
              {showCreate ? (
                <div 
                  className="px-4 py-2 cursor-pointer flex items-center hover:bg-muted"
                  onClick={() => {
                    onChange(`NEW:${inputValue}`)
                    setOpen(false)
                    setInputValue("")
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create "{inputValue}"
                </div>
              ) : "No supplier found."}
            </CommandEmpty>
            <CommandGroup>
              {suppliers?.map((s) => (
                <CommandItem
                  key={s.id}
                  value={s.name}
                  onSelect={() => {
                    onChange(s.id)
                    setOpen(false)
                    setInputValue("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === s.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {s.name}
                </CommandItem>
              ))}
              {showCreate && (
                <CommandItem
                  value={`NEW:${inputValue}`}
                  onSelect={() => {
                    onChange(`NEW:${inputValue}`)
                    setOpen(false)
                    setInputValue("")
                  }}
                  className="border-t mt-1 pt-2 font-medium text-primary"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create "{inputValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
