import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useAddOrder } from "@/hooks/useDatabase";
import { useCheckoutLeadAutoSave } from "@/hooks/useCheckoutLeads";
import { useFacebookTracking } from "@/hooks/useFacebookTracking";
import { useShippingMethods } from "@/hooks/useShippingMethods";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CheckoutProgress from "@/components/checkout/CheckoutProgress";
import StepContactInfo from "@/components/checkout/StepContactInfo";
import StepShipping from "@/components/checkout/StepShipping";
import StepReview from "@/components/checkout/StepReview";
import { motion, AnimatePresence } from "framer-motion";
import DirhamIcon from "@/components/DirhamIcon";

const CheckoutPage = () => {
  const { items, cartTotal, clearCart, appliedCoupon, discountAmount } =
    useCart();
  const addOrder = useAddOrder();
  const navigate = useNavigate();
  const { fbTrackInitiateCheckout, fbTrackPurchase } = useFacebookTracking();
  const { save: saveCheckoutLead, markCompleted: markLeadCompleted } =
    useCheckoutLeadAutoSave();
  const { data: shippingMethods = [] } = useShippingMethods(true);
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const isDealer = !!user && profile?.role === "dealer" && profile?.is_approved;

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [selectedShippingId, setSelectedShippingId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    area: "",
    notes: "",
  });

  useEffect(() => {
    if (shippingMethods.length > 0 && !selectedShippingId) {
      setSelectedShippingId(shippingMethods[0].id);
    }
  }, [shippingMethods]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.user_metadata?.full_name || "",
        phone: prev.phone || user.user_metadata?.phone || "",
        area: prev.area || user.user_metadata?.area || "",
      }));
    }
  }, [user]);

  const selectedShipping = shippingMethods.find(
    (s) => s.id === selectedShippingId,
  );
  const shippingCharge = selectedShipping ? Number(selectedShipping.charge) : 0;
  const total = cartTotal - discountAmount + shippingCharge;

  // Track initiate checkout
  useEffect(() => {
    if (items.length > 0) {
      fbTrackInitiateCheckout({
        content_ids: items.map((i) => i.product.id),
        value: cartTotal,
        num_items: items.reduce((s, i) => s + i.quantity, 0),
      });
    }
  }, []);

  // Auto-save lead
  useEffect(() => {
    if (items.length === 0) return;
    saveCheckoutLead({
      name: form.fullName,
      phone: form.phone,
      email: "",
      address: form.address,
      area: form.area,
      notes: form.notes,
      cartItems: items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.product.price,
      })),
      cartTotal: total,
    });
  }, [form, items.length, selectedShippingId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep0 = () => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = t("checkout.name_required");
    if (!form.phone.trim()) newErrors.phone = t("checkout.phone_required");
    else if (form.phone.replace(/\D/g, "").length < 8)
      newErrors.phone = t("checkout.phone_invalid");
    if (!form.area.trim()) newErrors.area = "Area is required";
    if (!form.address.trim())
      newErrors.address = t("checkout.address_required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (step === 0 && !validateStep0()) return;
    setStep((prev) => Math.min(prev + 1, 2));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const orderItems = items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: item.product.price,
      image: item.product.image,
    }));
    const shippingAddress = form.area
      ? `${form.area}, ${form.address}, Oman`
      : `${form.address}, Oman`;
    const orderNumber = `ORD${String(Date.now()).slice(-6)}`;

    try {
      await addOrder.mutateAsync({
        order_number: orderNumber,
        customer_name: form.fullName,
        customer_email: user?.email || "",
        customer_phone: form.phone,
        items: orderItems,
        total,
        status: "pending",
        payment_method: "cod",
        shipping_address: shippingAddress,
        notes: `${form.notes}${selectedShipping ? `\nShipping: ${selectedShipping.name} (${shippingCharge === 0 ? "Free" : "OMR " + shippingCharge})` : ""}${appliedCoupon ? `\nCoupon Applied: ${appliedCoupon.code} (-OMR ${discountAmount.toFixed(2)})` : ""}`,
      });
      await markLeadCompleted();

      // Decrease stock for each item
      for (const item of items) {
        if (item.product.id) {
          const { data: currentProduct } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product.id)
            .single();
          if (currentProduct && typeof currentProduct.stock === "number") {
            await supabase
              .from("products")
              .update({
                stock: Math.max(0, currentProduct.stock - item.quantity),
              })
              .eq("id", item.product.id);
          }
        }
      }

      setOrderId(orderNumber);
      fbTrackPurchase({
        content_ids: items.map((i) => i.product.id),
        value: total,
        num_items: items.reduce((s, i) => s + i.quantity, 0),
        order_id: orderNumber,
      });
      clearCart();
      setOrderPlaced(true);
      toast.success(t("checkout.order_success"));
    } catch {
      toast.error(t("checkout.order_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!orderPlaced && items.length === 0) {
    navigate("/cart");
    return null;
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 text-center px-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="w-20 h-20 mx-auto mb-6 text-green-500" />
          </motion.div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t("checkout.order_confirmed")}
          </h1>
          <p className="font-body text-muted-foreground mb-2">
            {t("checkout.title")}{" "}
            <span className="font-bold text-primary">{orderId}</span>{" "}
            {t("checkout.order_placed")}
          </p>
          <p className="font-body text-muted-foreground mb-8">
            {t("checkout.payment_cod")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/parts"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3 font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all rounded-md"
            >
              {t("checkout.continue_shopping")}
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-8 py-3 font-body text-sm font-bold tracking-wider uppercase hover:bg-muted transition-all rounded-md"
            >
              {t("checkout.go_home")}
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const stepVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-10 max-w-2xl">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> {t("checkout.back_to_cart")}
          </Link>

          <div className="flex items-center justify-between mb-2">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              {t("checkout.title")}
            </h1>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-body text-xs">
                {t("checkout.secure_checkout")}
              </span>
            </div>
          </div>

          <CheckoutProgress currentStep={step} />

          <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                {step === 0 && (
                  <StepContactInfo
                    form={form}
                    errors={errors}
                    onChange={handleChange}
                  />
                )}
                {step === 1 && (
                  <StepShipping
                    methods={shippingMethods}
                    selectedId={selectedShippingId}
                    onSelect={setSelectedShippingId}
                  />
                )}
                {step === 2 && (
                  <StepReview
                    form={form}
                    items={items}
                    cartTotal={cartTotal}
                    shippingName={selectedShipping?.name || ""}
                    shippingCharge={shippingCharge}
                    total={total}
                    discountAmount={discountAmount}
                    appliedCoupon={appliedCoupon}
                    onEditStep={setStep}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> {t("checkout.back")}
                </button>
              ) : (
                <div />
              )}

              {step < 2 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-primary text-primary-foreground px-8 py-3 font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all rounded-md flex items-center gap-2"
                >
                  {t("checkout.next")} <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground px-8 py-3 font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all rounded-md disabled:opacity-50"
                >
                  {isSubmitting
                    ? t("checkout.placing")
                    : t("checkout.place_order")}
                </button>
              )}
            </div>
          </div>

          {/* Mini order summary below on mobile */}
          <div className="mt-4 bg-muted/50 rounded-lg p-4 flex items-center justify-between font-body text-sm">
            <span className="text-muted-foreground">
              {items.reduce((s, i) => s + i.quantity, 0)}{" "}
              {t("checkout.items_count")}
            </span>
            <span className="font-bold text-blue-500 flex items-center">
              <DirhamIcon className="w-[3em] mr-1" />
              {total.toFixed(3)}
            </span>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
