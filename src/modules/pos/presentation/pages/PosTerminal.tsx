import React, { useState } from "react";
import { usePosSession } from "../hooks/usePosSession";
import { usePosCart } from "../hooks/usePosCart";
import { useProducts } from "../../../product/presentation/hooks/useProducts";
import { useCustomers } from "../../../customer/presentation/hooks/useCustomers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ShoppingCart, Trash2, User, CreditCard, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PosPaymentModal from "../components/PosPaymentModal";

export default function PosTerminal() {
  const navigate = useNavigate();
  const { currentShift, isLoadingShift, registers } = usePosSession();
  const { products } = useProducts();
  const { customers } = useCustomers();
  
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);

  // Assuming warehouse_id comes from the register
  const register = registers?.find(r => r.id === currentShift?.register_id);
  
  const { 
    cart, addItem, removeItem, clearCart, 
    subtotal, totalDiscount, total, checkout, isCheckingOut 
  } = usePosCart(
    register?.warehouse_id || "", 
    currentShift?.id, 
    selectedCustomerId, 
    selectedCustomer?.customer_group || ""
  );

  if (isLoadingShift) return <div className="p-12 text-center">Loading POS...</div>;
  
  if (!currentShift) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-red-600">No Active Shift</h2>
        <p>You must open a register shift before accessing the terminal.</p>
        <Button onClick={() => navigate("/admin/pos")}>Go to POS Dashboard</Button>
      </div>
    );
  }

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    // Find variation by SKU
    let found = false;
    for (const p of products || []) {
      const v = p.product_variations?.find((x: any) => x.sku === barcodeInput.trim());
      if (v) {
        addItem(v, p, 1);
        found = true;
        break;
      }
    }
    
    setBarcodeInput(""); // clear input for next scan
  };

  const handlePaymentComplete = async (payments: any[]) => {
    try {
      await checkout(payments);
      setIsPaymentModalOpen(false);
      setSelectedCustomerId("");
      // Could navigate to receipt view here
    } catch (e) {}
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6">
      {/* Left Panel: Products & Search */}
      <div className="flex-1 flex flex-col bg-muted/10 border-r">
        <div className="p-4 border-b bg-background flex items-center space-x-4">
          <Link to="/admin/pos">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <form onSubmit={handleBarcodeSubmit} className="flex-1 flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                autoFocus
                placeholder="Scan barcode or enter SKU..." 
                className="pl-9"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
              />
            </div>
            <Button type="submit">Add</Button>
          </form>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products?.map(p => 
              p.product_variations?.map((v: any) => (
                <div 
                  key={v.id} 
                  className="bg-card border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors text-center shadow-sm"
                  onClick={() => addItem(v, p, 1)}
                >
                  <div className="font-semibold text-sm mb-1 line-clamp-2 h-10">{p.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">{v.sku}</div>
                  {/* We don't show dynamic price here easily since it depends on qty/customer, just generic UI */}
                  <Button variant="secondary" size="sm" className="w-full mt-2">Add to Cart</Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel: Cart & Checkout */}
      <div className="w-96 flex flex-col bg-background flex-shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <select 
              className="flex-1 border-0 bg-transparent text-sm focus:ring-0 p-1"
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
            >
              <option value="">Walk-in Customer</option>
              {customers?.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.customer_group})</option>
              ))}
            </select>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start border-b pb-4">
                  <div className="flex-1 pr-2">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.sku}</div>
                    <div className="text-xs mt-1 text-primary">
                      {item.quantity} {item.uom_abbreviation} x ${item.unit_price.toFixed(2)}
                    </div>
                    {item.applied_rules && item.applied_rules.length > 0 && (
                      <div className="text-[10px] text-green-600 mt-1 flex flex-wrap gap-1">
                        {item.applied_rules.map((r, i) => <span key={i} className="bg-green-100 px-1 rounded">{r}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${item.total_price.toFixed(2)}</div>
                    {item.discount_amount > 0 && (
                      <div className="text-xs text-green-600 line-through">${(item.unit_price * item.quantity).toFixed(2)}</div>
                    )}
                    <button onClick={() => removeItem(item.variation_id)} className="text-red-500 hover:text-red-700 mt-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 bg-muted/30 border-t space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-${totalDiscount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-2">
            <Button variant="outline" onClick={clearCart} disabled={cart.length === 0}>Clear</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={cart.length === 0}
            >
              <CreditCard className="w-4 h-4 mr-2" /> Pay
            </Button>
          </div>
        </div>
      </div>

      <PosPaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        totalAmount={total}
        onComplete={handlePaymentComplete}
        isProcessing={isCheckingOut}
      />
    </div>
  );
}
