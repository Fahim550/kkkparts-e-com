import { Truck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import DirhamIcon from "@/components/DirhamIcon";

interface ShippingMethod {
  id: string;
  name: string;
  charge: number;
  area_zone?: string;
  estimated_delivery?: string | null;
  description?: string | null;
}

interface StepShippingProps {
  methods: ShippingMethod[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const StepShipping = ({ methods, selectedId, onSelect }: StepShippingProps) => {
  const { t } = useLanguage();

  if (methods.length === 0) {
    return (
      <p className="font-body text-sm text-muted-foreground py-8 text-center">
        {t("checkout.no_shipping")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {methods.map((method) => {
        const isSelected = selectedId === method.id;
        const charge = Number(method.charge);

        return (
          <label
            key={method.id}
            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
              isSelected
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/30"
            }`}
          >
            <input
              type="radio"
              name="shipping"
              value={method.id}
              checked={isSelected}
              onChange={() => onSelect(method.id)}
              className="sr-only"
            />
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                isSelected ? "border-primary" : "border-muted-foreground"
              }`}
            >
              {isSelected && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-body text-sm font-bold text-foreground">
                  {method.name}
                </p>
                <span className="font-body text-sm font-bold text-primary">
                  {charge === 0 ? (
                    t("cart.free")
                  ) : (
                    <>
                      <DirhamIcon className="w-[1.2em] mr-1" />
                      {charge.toFixed(3)}
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {method.area_zone && (
                  <span className="font-body text-xs text-muted-foreground">
                    {method.area_zone}
                  </span>
                )}
                {method.estimated_delivery && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      {method.estimated_delivery}
                    </span>
                  </>
                )}
              </div>
              {method.description && (
                <p className="font-body text-xs text-muted-foreground mt-1">
                  {method.description}
                </p>
              )}
            </div>
          </label>
        );
      })}

      {/* Payment info */}
      <div className="mt-6 pt-4 border-t border-border">
        <h3 className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-3">
          {t("checkout.payment_method")}
        </h3>
        <div className="flex items-center gap-3 p-4 border-2 border-primary rounded-lg bg-primary/5">
          <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
          <div>
            <p className="font-body text-sm font-bold text-foreground">
              {t("checkout.cod")}
            </p>
            <p className="font-body text-xs text-muted-foreground">
              {t("checkout.cod_desc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepShipping;
