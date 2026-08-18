import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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

interface ProductComboboxProps {
  products: any[]
  value: string
  onChange: (value: string) => void
}

export function ProductCombobox({ products, value, onChange }: ProductComboboxProps) {
  const [open, setOpen] = React.useState(false)

  // Flatten products into variations
  const variations = React.useMemo(() => {
    const list: any[] = []
    products.forEach(p => {
      p.product_variations?.forEach((v: any) => {
        // Now stock_balances comes directly from v.stock_balances
        const variationStocks = v.stock_balances || []
        const totalStock = variationStocks.reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0)
        const locations = Array.from(new Set(variationStocks.map((s: any) => s.warehouse_bins?.name).filter(Boolean))).join(", ")

        list.push({
          id: v.id,
          name: `${p.name} ${v.sku ? `(${v.sku})` : ''}`,
          salePrice: Number(v.sell_price || v.price || p.price || 0),
          purchasePrice: Number(v.cost_price || p.original_price || p.price || 0),
          stock: totalStock, 
          location: locations || "-", 
          productId: p.id
        })
      })
    })
    return list
  }, [products])

  const selected = variations.find(v => v.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between border-0 shadow-none focus:ring-1 h-9 rounded bg-transparent px-3 text-left font-normal"
        >
          <span className="truncate">
            {selected ? selected.name : "Select Item..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search items..." />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              <div className="flex items-center px-4 py-2 text-xs font-semibold text-muted-foreground uppercase border-b bg-muted/50">
                <div className="flex-1 min-w-[200px] ml-6">Item</div>
                <div className="w-24 text-right">Sale Price</div>
                <div className="w-24 text-right">Purchase Price</div>
                <div className="w-20 text-right">Stock</div>
                <div className="w-24 text-right">Location</div>
              </div>
              {variations.map((v) => (
                <CommandItem
                  key={v.id}
                  value={v.name}
                  onSelect={() => {
                    onChange(v.id)
                    setOpen(false)
                  }}
                  className="flex items-center px-4 py-2 cursor-pointer"
                >
                  <div className="flex-1 min-w-[200px] font-medium truncate pr-4 flex items-center">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === v.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{v.name}</span>
                  </div>
                  <div className="w-24 text-right">{v.salePrice}</div>
                  <div className="w-24 text-right">{v.purchasePrice}</div>
                  <div className={cn("w-20 text-right font-medium", v.stock > 0 ? "text-green-600" : "text-red-500")}>
                    {v.stock}
                  </div>
                  <div className="w-24 text-right text-muted-foreground">{v.location}</div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
