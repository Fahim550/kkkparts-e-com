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

interface CustomerComboboxProps {
  customers: any[]
  value: string
  onChange: (value: string) => void
}

export function CustomerCombobox({ customers, value, onChange }: CustomerComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const selected = customers?.find(c => c.id === value)
  const isNew = value.startsWith("NEW:")
  const displayValue = selected ? `${selected.name} ${selected.customer_group ? `(${selected.customer_group})` : ''}` : (isNew ? value.substring(4) : "Select Customer...")

  const showCreate = inputValue.length > 0 && !customers?.some(c => c.name.toLowerCase() === inputValue.toLowerCase())

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
          <CommandInput placeholder="Search customers..." value={inputValue} onValueChange={setInputValue} />
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
              ) : "No customer found."}
            </CommandEmpty>
            <CommandGroup>
              {customers?.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.name}
                  onSelect={() => {
                    onChange(c.id)
                    setOpen(false)
                    setInputValue("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === c.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {c.name} {c.customer_group ? `(${c.customer_group})` : ''}
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
