import { useLanguage } from "@/context/LanguageContext";
import { Pencil } from "lucide-react";
import DirhamIcon from "@/components/DirhamIcon";

interface CartItem {
  product: { id: string; name: string; image: string; price: number };
  quantity: number;
  size: number;
  color: string;
}

interface StepReviewProps {
  form: { fullName: string; phone: string; address: string; notes: string };
  items: CartItem[];
  cartTotal: number;
  shippingName: string;
  shippingCharge: number;
  total: number;
  discountAmount: number;
  appliedCoupon: { code: string } | null;
  onEditStep: (step: number) => void;
}

const StepReview = ({
  form,
  items,
  cartTotal,
  shippingName,
  shippingCharge,
  total,
  discountAmount,
  appliedCoupon,
  onEditStep,
}: StepReviewProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Contact summary */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-body text-xs uppercase tracking-wider text-muted-foreground">
            {t("checkout.contact_info")}
          </h3>
          <button
            type="button"
            onClick={() => onEditStep(0)}
            className="text-primary text-xs font-body flex items-center gap-1 hover:underline"
          >
            <Pencil className="w-3 h-3" /> {t("checkout.edit")}
          </button>
        </div>
        <div className="space-y-1 font-body text-sm text-foreground">
          <p className="font-bold">{form.fullName}</p>
          <p>{form.phone}</p>
          <p>{form.address}</p>
          {form.notes && (
            <p className="text-muted-foreground text-xs mt-2">
              📝 {form.notes}
            </p>
          )}
        </div>
      </div>

      {/* Shipping summary */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-body text-xs uppercase tracking-wider text-muted-foreground">
            {t("checkout.shipping_method")}
          </h3>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="text-primary text-xs font-body flex items-center gap-1 hover:underline"
          >
            <Pencil className="w-3 h-3" /> {t("checkout.edit")}
          </button>
        </div>
        <div className="flex items-center justify-between font-body text-sm">
          <span className="text-foreground">{shippingName}</span>
          <span className="font-bold text-primary flex items-center">
            {shippingCharge === 0 ? (
              t("cart.free")
            ) : (
              <>
                <DirhamIcon className="w-[3em] mr-1" />
                {shippingCharge.toFixed(3)}
              </>
            )}
          </span>
        </div>
        <p className="font-body text-xs text-muted-foreground mt-1">
          {t("checkout.cod")}
        </p>
      </div>

      {/* Items */}
      <div>
        <h3 className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-3">
          {items.reduce((s, i) => s + i.quantity, 0)}{" "}
          {t("checkout.items_count")}
        </h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={`${item.product.id}-${item.size}-${item.color}`}
              className="flex gap-3 p-3 bg-muted/30 rounded-lg"
            >
              <div className="w-14 h-14 bg-muted rounded overflow-hidden shrink-0">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-xs font-bold truncate text-foreground">
                  {item.product.name}
                </p>
                <p className="font-body text-xs text-muted-foreground">
                  {t("size")} {item.size} · {item.color} · x{item.quantity}
                </p>
                <p className="font-body text-xs font-bold text-blue-500 flex items-center">
                  <DirhamIcon className="w-2em] mr-1" />
                  {(item.product.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="border-t border-border pt-4 space-y-2 font-body text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("cart.subtotal")}</span>
          <span className="flex items-center">
            <DirhamIcon className="w-[3em] mr-1" />
            {cartTotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("cart.shipping")}</span>
          <span className="flex items-center">
            {shippingCharge === 0 ? (
              t("cart.free")
            ) : (
              <>
                <DirhamIcon className="w-[3em] mr-1" />
                {shippingCharge.toFixed(3)}
              </>
            )}
          </span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({appliedCoupon.code})</span>
            <span className="flex items-center">
              -<DirhamIcon className="w-[1.2em] mx-1" />
              {discountAmount.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between font-heading text-xl font-bold border-t border-border pt-3 text-foreground">
          <span>{t("cart.total")}</span>
          <span className="text-blue-500 font-bold flex items-center">
            <DirhamIcon className="w-[3em] mr-1" />
            {total.toFixed(3)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StepReview;
