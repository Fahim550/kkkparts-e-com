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
import ProductFormModal from "@/modules/product/presentation/pages/ProductFormModal"

interface ProductComboboxProps {
  products: any[]
  value: string
  onChange: (value: string, variation?: any, product?: any) => void
  warehouseId?: string
}

export function ProductCombobox({ products, value, onChange, warehouseId }: ProductComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Flatten products into variations
  const variations = React.useMemo(() => {
    const list: any[] = []
    products.forEach(p => {
      p.product_variations?.forEach((v: any) => {
        // Stock balances comes directly from v.stock_balances
        const variationStocks = v.stock_balances || []
        const totalStock = variationStocks.reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0)
        const displayStock = warehouseId
          ? variationStocks
              .filter((s: any) => s.warehouse_id === warehouseId)
              .reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0)
          : totalStock
        const relevantStocks = warehouseId
          ? variationStocks.filter((s: any) => s.warehouse_id === warehouseId)
          : variationStocks
        const locations = Array.from(new Set(relevantStocks.map((s: any) => s.warehouse_bins?.name).filter(Boolean))).join(", ")

        list.push({
          id: v.id,
          name: `${p.name} ${v.sku ? `(${v.sku})` : ''}`,
          salePrice: Number(v.sell_price || v.price || p.price || 0),
          purchasePrice: Number(v.cost_price || p.original_price || p.price || 0),
          stock: displayStock, 
          location: locations || "-", 
          productId: p.id,
          rawProduct: p,
          rawVariation: v,
        })
      })
    })
    return list
  }, [products, warehouseId])

  const selected = variations.find(v => v.id === value)

  return (
    <>
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
        <PopoverContent
          className="w-[800px] p-0 shadow-lg border rounded-lg"
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
              placeholder="Search items..."
              value={inputValue}
              onValueChange={setInputValue}
            />

            {/* TOP OF DROPDOWN: ADD NEW PRODUCT (SINGLE BUTTON) */}
            <div className="p-1.5 border-b bg-muted/40">
              <Button
                type="button"
                tabIndex={-1}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary h-8 gap-2 px-2"
                onClick={() => {
                  setOpen(false)
                  setCreateModalOpen(true)
                }}
              >
                <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                <span>Add New Product</span>
              </Button>
            </div>

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
                      onChange(v.id, v.rawVariation, v.rawProduct)
                      setOpen(false)
                      setInputValue("")
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

      <ProductFormModal
        isOpen={createModalOpen}
        onOpenChange={setCreateModalOpen}
        product={null}
        onSuccess={(savedProduct, createdVariation) => {
          const varId = createdVariation?.id || savedProduct?.product_variations?.[0]?.id;
          if (varId) {
            onChange(varId, createdVariation, savedProduct);
          }
          setInputValue("");
          setCreateModalOpen(false);
        }}
      />
    </>
  )
}
