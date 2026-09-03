import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
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
import { CreateCustomerModal } from "@/components/admin/CreateCustomerModal"

interface CustomerComboboxProps {
  customers: any[]
  value: string
  onChange: (value: string, customer?: any) => void
}

export function CustomerCombobox({ customers, value, onChange }: CustomerComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [initialName, setInitialName] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selected = customers?.find(c => c.id === value)
  const isNew = value.startsWith("NEW:")
  const displayValue = selected ? `${selected.name} ${selected.customer_group ? `(${selected.customer_group})` : ''}` : (isNew ? value.substring(4) : "Select Customer...")

  const handleOpenCreateModal = (nameToPrefill: string = "") => {
    setInitialName(nameToPrefill)
    setOpen(false)
    setCreateModalOpen(true)
  }

  return (
    <>
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
        <PopoverContent
          className="w-[320px] p-0 shadow-lg border rounded-lg"
          align="start"
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            setTimeout(() => {
              inputRef.current?.focus()
            }, 0)
          }}
        >
          <Command>
            <CommandInput
              ref={inputRef}
              placeholder="Search customers..."
              value={inputValue}
              onValueChange={setInputValue}
            />

            {/* TOP OF DROPDOWN: ADD NEW CUSTOMER (SINGLE BUTTON) */}
            <div className="p-1.5 border-b bg-muted/40">
              <Button
                type="button"
                tabIndex={-1}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary h-8 gap-2 px-2"
                onClick={() => handleOpenCreateModal(inputValue.trim())}
              >
                <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                <span>Add New Customer</span>
              </Button>
            </div>

            <CommandList>
              <CommandEmpty>No customer found.</CommandEmpty>
              <CommandGroup>
                {customers?.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.name}
                    onSelect={() => {
                      onChange(c.id, c)
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
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateCustomerModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        initialName={initialName}
        onSuccess={(newCustomer) => {
          onChange(newCustomer.id, newCustomer)
          setInputValue("")
          setCreateModalOpen(false)
        }}
      />
    </>
  )
}

