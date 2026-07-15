import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { User, Phone, MapPin, MessageSquare } from "lucide-react";

interface StepContactInfoProps {
  form: {
    fullName: string;
    phone: string;
    address: string;
    area: string;
    notes: string;
  };
  errors: Record<string, string>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

const StepContactInfo = ({ form, errors, onChange }: StepContactInfoProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-5">
      <div>
        <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" /> {t("checkout.full_name")} *
        </label>
        <Input
          name="fullName"
          value={form.fullName}
          onChange={onChange}
          placeholder="Ahmed Al-Sabah"
          className={
            errors.fullName
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }
        />
        {errors.fullName && (
          <p className="text-xs text-destructive mt-1 font-body">
            {errors.fullName}
          </p>
        )}
      </div>

      <div>
        <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" /> {t("checkout.phone")} *
        </label>
        <Input
          name="phone"
          value={form.phone}
          onChange={onChange}
          placeholder="+965 9900 1122"
          type="tel"
          className={
            errors.phone
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }
        />
        {errors.phone && (
          <p className="text-xs text-destructive mt-1 font-body">
            {errors.phone}
          </p>
        )}
      </div>

      <div>
        <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Area *
        </label>
        <Input
          name="area"
          value={form.area}
          onChange={onChange}
          placeholder="e.g. Al Khuwair, Ruwi, Seeb"
          className={
            errors.area
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }
        />
        {errors.area && (
          <p className="text-xs text-destructive mt-1 font-body">
            {errors.area}
          </p>
        )}
      </div>

      <div>
        <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> {t("checkout.shipping_address")} *
        </label>
        <Input
          name="address"
          value={form.address}
          onChange={onChange}
          placeholder="Area, Block 5, Street 10, Building 3"
          className={
            errors.address
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }
        />
        {errors.address && (
          <p className="text-xs text-destructive mt-1 font-body">
            {errors.address}
          </p>
        )}
      </div>

      <div>
        <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" /> {t("checkout.notes")}
        </label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={onChange}
          placeholder={t("checkout.delivery_instructions")}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] font-body"
        />
      </div>
    </div>
  );
};

export default StepContactInfo;
