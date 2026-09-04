import * as React from "react"
import { Check, ChevronsUpDown, UserPlus, Building2 } from "lucide-react"
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
  const [initialGroup, setInitialGroup] = React.useState<"Retail" | "Dealer">("Retail")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selected = customers?.find(c => c.id === value)
  const isNew = value.startsWith("NEW:")
  
  const displayTitle = selected ? selected.name : (isNew ? value.substring(4) : "Select Customer or Dealer...")
  const displayGroup = selected?.customer_group

  const handleOpenCreateModal = (nameToPrefill: string = "", group: "Retail" | "Dealer" = "Retail") => {
    setInitialName(nameToPrefill)
    setInitialGroup(group)
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
            className="w-full justify-between bg-background px-3 font-normal h-10"
          >
            <div className="flex items-center gap-2 truncate">
              <span className={cn("truncate font-medium", !selected && !isNew && "text-muted-foreground font-normal")}>
                {displayTitle}
              </span>
              {displayGroup && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 uppercase tracking-wider",
                    displayGroup === "Dealer"
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {displayGroup}
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[340px] p-0 shadow-lg border rounded-lg"
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
              placeholder="Search customer, dealer, or phone..."
              value={inputValue}
              onValueChange={setInputValue}
            />

            {/* TOP ACTIONS: QUICK CREATE CUSTOMER & DEALER */}
            <div className="p-1.5 border-b bg-muted/40 grid grid-cols-2 gap-1.5">
              <Button
                type="button"
                tabIndex={-1}
                variant="ghost"
                size="sm"
                className="justify-start text-xs font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 h-8 gap-1.5 px-2"
                onClick={() => handleOpenCreateModal(inputValue.trim(), "Retail")}
              >
                <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <UserPlus className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">Add Customer</span>
              </Button>

              <Button
                type="button"
                tabIndex={-1}
                variant="ghost"
                size="sm"
                className="justify-start text-xs font-semibold text-blue-700 hover:bg-blue-50 hover:text-blue-800 h-8 gap-1.5 px-2"
                onClick={() => handleOpenCreateModal(inputValue.trim(), "Dealer")}
              >
                <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">Add Dealer</span>
              </Button>
            </div>

            <CommandList>
              <CommandEmpty>
                <div className="p-2 text-center text-xs text-muted-foreground space-y-2">
                  <div>No customer or dealer found.</div>
                  {inputValue.trim() && (
                    <div className="flex flex-col gap-1 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs h-7 gap-1.5 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleOpenCreateModal(inputValue.trim(), "Retail")}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span className="truncate">Create "{inputValue.trim()}" as Customer</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs h-7 gap-1.5 text-blue-700 hover:bg-blue-50"
                        onClick={() => handleOpenCreateModal(inputValue.trim(), "Dealer")}
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="truncate">Create "{inputValue.trim()}" as Dealer</span>
                      </Button>
                    </div>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {customers?.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.name} ${c.customer_group || ''} ${c.contact_phone || ''}`}
                    onSelect={() => {
                      onChange(c.id, c)
                      setOpen(false)
                      setInputValue("")
                    }}
                    className="flex items-center justify-between py-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          value === c.id ? "opacity-100 text-primary" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-xs truncate">{c.name}</span>
                        {c.contact_phone && (
                          <span className="text-[10px] text-muted-foreground truncate">{c.contact_phone}</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 uppercase tracking-wider",
                        c.customer_group === "Dealer"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {c.customer_group || "Retail"}
                    </span>
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
        initialGroup={initialGroup}
        onSuccess={(newCustomer) => {
          onChange(newCustomer.id, newCustomer)
          setInputValue("")
          setCreateModalOpen(false)
        }}
      />
    </>
  )
}
