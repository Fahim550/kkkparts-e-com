import { useLanguage } from "@/context/LanguageContext";
import { useActiveCategories } from "@/hooks/useCategories";
import { useSettings } from "@/hooks/useDatabase";
import {
  ArrowUp,
  ChevronRight,
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Truck,
  Twitter,
  Youtube
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const Footer = () => {
  const { data: settings } = useSettings();
  const { data: categories = [] } = useActiveCategories();
  const { t } = useLanguage();
  const s = Array.isArray(settings) ? settings[0] || {} : settings || {};

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (s?.favicon_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = s.favicon_url;
    }
    if (s?.site_name) {
      document.title = s.meta_title || s.site_name;
    }
  }, [s?.favicon_url, s?.site_name, s?.meta_title]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setIsSubscribed(true);
    toast.success("Thank you for subscribing to our newsletter!");
    setNewsletterEmail("");
  };

  const formattedWhatsapp = s?.whatsapp_number
    ? s.whatsapp_number.replace(/[^0-9]/g, "")
    : "";

  return (
    <footer className="relative bg-slate-950 text-slate-100 overflow-hidden border-t border-slate-800">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Value Propositions Strip */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm py-6">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center text-neon shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-100">
                  100% Genuine Parts
                </h4>
                <p className="font-body text-xs text-slate-400">
                  Guaranteed OEM & High Quality Auto Parts
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center text-neon shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-100">
                  Express Delivery
                </h4>
                <p className="font-body text-xs text-slate-400">
                  Fast shipping across Oman & Region
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center text-neon shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-100">
                  Dedicated Support
                </h4>
                <p className="font-body text-xs text-slate-400">
                  24/7 Expert Fitment & Order Assistance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Section */}
      <div className="container mx-auto px-4 lg:px-8 py-14">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Column 1: Brand & Overview */}
          <div className="space-y-5">
            <Link to="/" className="inline-block">
              {s?.logo_url ? (
                <img
                  src={s.logo_url}
                  alt={s?.site_name || "KKK Parts"}
                  className="h-12 w-auto object-contain"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-heading text-2xl font-bold uppercase tracking-wider text-white">
                    {s?.site_name || "KKK PARTS"}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-neon animate-pulse" />
                </div>
              )}
            </Link>

            <p className="text-slate-400 font-body text-sm leading-relaxed">
              {s?.footer_description ||
                "Your premier destination for authentic auto parts, accessories, and performance gear."}
            </p>

            {/* WhatsApp Quick Chat Button */}
            {s?.whatsapp_number && (
              <a
                href={`https://wa.me/${formattedWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-sm"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-400 text-emerald-950" />
                Chat on WhatsApp
              </a>
            )}

            {/* Social Media Links */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                Follow Us
              </span>
              <div className="flex gap-2.5">
                {s?.instagram_url ? (
                  <a
                    href={s.instagram_url}
                    aria-label="Instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-neon hover:border-neon/50 hover:bg-neon/10 transition-all"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                ) : null}
                {s?.facebook_url ? (
                  <a
                    href={s.facebook_url}
                    aria-label="Facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-neon hover:border-neon/50 hover:bg-neon/10 transition-all"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                ) : null}
                {s?.twitter_url ? (
                  <a
                    href={s.twitter_url}
                    aria-label="Twitter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-neon hover:border-neon/50 hover:bg-neon/10 transition-all"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                ) : null}
                {s?.youtube_url ? (
                  <a
                    href={s.youtube_url}
                    aria-label="YouTube"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-neon hover:border-neon/50 hover:bg-neon/10 transition-all"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                ) : null}
                {!s?.instagram_url && !s?.facebook_url && !s?.twitter_url && !s?.youtube_url && (
                  <>
                    <span className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                      <Instagram className="w-4 h-4" />
                    </span>
                    <span className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                      <Facebook className="w-4 h-4" />
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Shop (Dynamic Product Categories) */}
          <div>
            <h4 className="font-heading text-base font-bold uppercase tracking-wider text-white mb-5 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-neon" />
              {t("footer.shop") || "Shop"}
            </h4>
            <ul className="space-y-2.5 font-body text-sm">
              {categories.length > 0 ? (
                categories.slice(0, 7).map((cat) => (
                  <li key={cat.id}>
                    <Link
                      to={`/parts?category=${encodeURIComponent(cat.slug || cat.name)}`}
                      className="group inline-flex items-center gap-2.5 text-slate-400 hover:text-neon transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-neon group-hover:translate-x-0.5 transition-all shrink-0" />
                      <span className="truncate">{cat.name}</span>
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link
                    to="/parts"
                    className="group inline-flex items-center gap-2 text-slate-400 hover:text-neon transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-neon" />
                    All Products
                  </Link>
                </li>
              )}
              <li>
                <Link
                  to="/parts"
                  className="group inline-flex items-center gap-2 text-neon font-semibold text-xs uppercase tracking-wider pt-2 hover:underline"
                >
                  View All Products <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 & 4 Container (Quick Links + Contact Info + Newsletter Box at bottom) */}
          <div className="lg:col-span-2 flex flex-col justify-between space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Column 3: Quick Navigation Links */}
              <div>
                <h4 className="font-heading text-base font-bold uppercase tracking-wider text-white mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-4 rounded-full bg-neon" />
                  Quick Links
                </h4>
                <ul className="space-y-2.5 font-body text-sm">
                  <li>
                    <Link
                      to="/parts"
                      className="group inline-flex items-center gap-2 text-slate-400 hover:text-neon transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-neon group-hover:translate-x-0.5 transition-all" />
                      {t("nav.shop") || "Shop Parts"}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/about"
                      className="group inline-flex items-center gap-2 text-slate-400 hover:text-neon transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-neon group-hover:translate-x-0.5 transition-all" />
                      {t("footer.about") || "About Us"}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      className="group inline-flex items-center gap-2 text-slate-400 hover:text-neon transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-neon group-hover:translate-x-0.5 transition-all" />
                      {t("footer.contact") || "Contact Us"}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/dealer/dashboard"
                      className="group inline-flex items-center gap-2 text-slate-400 hover:text-neon transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-neon group-hover:translate-x-0.5 transition-all" />
                      Dealer Portal
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 4: Dynamic Contact Details */}
              <div>
                <h4 className="font-heading text-base font-bold uppercase tracking-wider text-white mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-4 rounded-full bg-neon" />
                  {t("footer.contact_title") || "Contact Info"}
                </h4>
                <div className="space-y-3.5 font-body text-sm text-slate-400">
                  {s?.contact_address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-neon shrink-0 mt-1" />
                      <span>{s.contact_address}</span>
                    </div>
                  )}
                  {s?.contact_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-neon shrink-0" />
                      <a
                        href={`mailto:${s.contact_email}`}
                        className="hover:text-neon transition-colors truncate"
                      >
                        {s.contact_email}
                      </a>
                    </div>
                  )}
                  {s?.contact_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-neon shrink-0" />
                      <a
                        href={`tel:${s.contact_phone}`}
                        className="hover:text-neon transition-colors"
                      >
                        {s.contact_phone}
                      </a>
                    </div>
                  )}
                  {s?.working_hours && (
                    <div className="flex items-start gap-3 pt-1 text-xs text-slate-400 border-t border-slate-800/80">
                      <Clock className="w-4 h-4 text-neon shrink-0 mt-0.5" />
                      <span>{s.working_hours}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Newsletter Subscription Box under Quick Links & Contact Info */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 shadow-lg mt-auto">
              <div>
                <h5 className="font-heading text-xs font-bold text-white uppercase tracking-wider">
                  {t("newsletter.title")}
                </h5>
                <p className="font-body text-[11px] text-slate-400 mt-0.5">
                  {t("newsletter.subtitle")}
                </p>
              </div>
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={t("newsletter.placeholder")}
                    required
                    className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-neon transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-neon text-accent-foreground font-bold text-xs uppercase tracking-wider hover:bg-neon-glow transition-all duration-300 flex items-center gap-1.5 shrink-0 shadow"
                >
                  <Send className="w-3 h-3" />
                  {t("newsletter.subscribe")}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom copyright & back to top strip */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <p className="font-body text-xs text-slate-500">
              {s?.footer_copyright || "© 2026 kkkparts.com All rights reserved."}
            </p>
            <p className="font-body text-[11px] text-slate-400">
              Designed & Developed by{" "}
              <a
                href="https://softzeniqit.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon hover:underline font-semibold"
              >
                SoftZeniq IT
              </a>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-medium transition-all"
            >
              Back to top
              <ArrowUp className="w-3.5 h-3.5 text-neon" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
