import { Check, User, Truck, ClipboardList } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface CheckoutProgressProps {
  currentStep: number;
}

const CheckoutProgress = ({ currentStep }: CheckoutProgressProps) => {
  const { t } = useLanguage();

  const steps = [
    { label: t("checkout.step_info"), icon: User },
    { label: t("checkout.step_shipping"), icon: Truck },
    { label: t("checkout.step_review"), icon: ClipboardList },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const Icon = step.icon;

        return (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 text-sm font-bold",
                  isCompleted && "bg-primary text-primary-foreground",
                  isActive &&
                    "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCompleted && !isActive && "bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 font-body font-medium transition-colors",
                  isActive || isCompleted
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-16 sm:w-24 h-0.5 mx-2 mb-6 transition-colors duration-300",
                  index < currentStep ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CheckoutProgress;
