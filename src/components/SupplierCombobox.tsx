import { CreateSupplierModal } from "@/components/admin/CreateSupplierModal"
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
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import * as React from "react"

interface SupplierComboboxProps {
  suppliers: any[]
  value: string
  onChange: (value: string, supplier?: any) => void
}

export function SupplierCombobox({ suppliers, value, onChange }: SupplierComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [initialName, setInitialName] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selected = suppliers?.find(s => s.id === value)
  const isNew = value.startsWith("NEW:")
  const displayValue = selected ? selected.name : (isNew ? value.substring(4) : "Select Supplier...")

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
              placeholder="Search suppliers..."
              value={inputValue}
              onValueChange={setInputValue}
            />

            {/* TOP OF DROPDOWN: ADD NEW SUPPLIER (SINGLE BUTTON) */}
            <div className="p-1.5 border-b bg-muted/40">
              <Button
                type="button"
                tabIndex={-1}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary h-8 gap-2 px-2"
                onClick={() => handleOpenCreateModal(inputValue.trim())}
              >
                <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                <span className="text-blue-600 font-semibold dark:text-blue-400">Add New Supplier</span>
              </Button>
            </div>

            <CommandList>
              <CommandEmpty>No supplier found.</CommandEmpty>
              <CommandGroup>
                {suppliers?.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={s.name}
                    onSelect={() => {
                      onChange(s.id, s)
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
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateSupplierModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        initialName={initialName}
        onSuccess={(newSupplier) => {
          onChange(newSupplier.id, newSupplier)
          setInputValue("")
          setCreateModalOpen(false)
        }}
      />
    </>
  )
}

