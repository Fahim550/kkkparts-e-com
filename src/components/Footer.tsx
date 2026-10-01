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
    <footer className="bg-slate-950 text-slate-300 font-body relative overflow-hidden">
      {/* Subtle blue gradient background effect */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Value Propositions Strip */}
      <div className="border-y border-slate-800/80 bg-slate-900/60 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
            
            <div className="py-8 md:py-10 px-4 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-5 group hover:bg-slate-800/20 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-neon/10 border border-neon/20 flex items-center justify-center text-neon group-hover:bg-neon group-hover:text-white group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="pt-1">
                <h4 className="font-heading text-sm font-bold text-white mb-1.5 uppercase tracking-wide group-hover:text-neon transition-colors">
                  100% Genuine Parts
                </h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Guaranteed OEM & High Quality Auto Parts for ultimate reliability.
                </p>
              </div>
            </div>

            <div className="py-8 md:py-10 px-4 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-5 group hover:bg-slate-800/20 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-neon/10 border border-neon/20 flex items-center justify-center text-neon group-hover:bg-neon group-hover:text-white group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all shrink-0">
                <Truck className="w-7 h-7" />
              </div>
              <div className="pt-1">
                <h4 className="font-heading text-sm font-bold text-white mb-1.5 uppercase tracking-wide group-hover:text-neon transition-colors">
                  Express Delivery
                </h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Fast and secure shipping across the Region directly to your door.
                </p>
              </div>
            </div>

            <div className="py-8 md:py-10 px-4 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-5 group hover:bg-slate-800/20 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-neon/10 border border-neon/20 flex items-center justify-center text-neon group-hover:bg-neon group-hover:text-white group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all shrink-0">
                <Clock className="w-7 h-7" />
              </div>
              <div className="pt-1">
                <h4 className="font-heading text-sm font-bold text-white mb-1.5 uppercase tracking-wide group-hover:text-neon transition-colors">
                  Dedicated Support
                </h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  24/7 Expert Fitment & Order Assistance whenever you need it.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Footer Section */}
      <div className="container mx-auto px-4 lg:px-8 pt-12 pb-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Column 1: Brand & Overview */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              {s?.logo_url ? (
                <img
                  src={s.logo_url}
                  alt={s?.site_name || "KKK Parts"}
                  className="h-10 w-auto object-contain brightness-0 invert"
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

            <p className="text-slate-400 text-sm leading-relaxed">
              {s?.footer_description ||
                "Your premier destination for authentic auto parts, accessories, and performance gear. Driving excellence every day."}
            </p>

            {/* WhatsApp Quick Chat Button */}
            {s?.whatsapp_number && (
              <a
                href={`https://wa.me/${formattedWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white text-sm font-semibold transition-all shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
              </a>
            )}

            {/* Social Media Links */}
            <div>
              <div className="flex gap-3 pt-2">
                {s?.facebook_url && (
                  <a href={s.facebook_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-neon hover:border-neon hover:text-white hover:shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all">
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {s?.instagram_url && (
                  <a href={s.instagram_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-neon hover:border-neon hover:text-white hover:shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all">
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {s?.twitter_url && (
                  <a href={s.twitter_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-neon hover:border-neon hover:text-white hover:shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all">
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {s?.youtube_url && (
                  <a href={s.youtube_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-neon hover:border-neon hover:text-white hover:shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all">
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {!s?.facebook_url && !s?.instagram_url && (
                  <>
                    <span className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                      <Facebook className="w-4 h-4" />
                    </span>
                    <span className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                      <Instagram className="w-4 h-4" />
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Shop */}
          <div>
            <h4 className="font-heading text-sm font-bold text-white mb-5 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-neon" />
              {t("footer.shop") || "Shop Categories"}
            </h4>
            <ul className="space-y-1.5 text-sm">
              {categories.length > 0 ? (
                categories.slice(0, 7).map((cat) => (
                  <li key={cat.id}>
                    <Link
                      to={`/parts?category=${encodeURIComponent(cat.slug || cat.name)}`}
                      className="group inline-flex items-center gap-2 text-slate-400 hover:text-neon transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-neon group-hover:translate-x-0.5 transition-all shrink-0" />
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link to="/parts" className="group inline-flex items-center gap-2 text-slate-400 hover:text-neon transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-neon group-hover:translate-x-0.5 transition-all shrink-0" />
                    All Products
                  </Link>
                </li>
              )}
              <li className="pt-2">
                <Link
                  to="/parts"
                  className="inline-flex items-center gap-1.5 text-neon font-semibold text-xs uppercase tracking-wider hover:text-white transition-colors"
                >
                  View All Products <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h4 className="font-heading text-sm font-bold text-white mb-5 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-neon" />
              Quick Links
            </h4>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/parts" className="group inline-flex items-center gap-2 text-slate-400 hover:text-neon transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-neon group-hover:translate-x-0.5 transition-all shrink-0" />
                  {t("nav.shop") || "Shop Parts"}
                </Link>
              </li>
              <li>
                <Link to="/about" className="group inline-flex items-center gap-2 text-slate-400 hover:text-neon transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-neon group-hover:translate-x-0.5 transition-all shrink-0" />
                  {t("footer.about") || "About Us"}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="group inline-flex items-center gap-2 text-slate-400 hover:text-neon transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-neon group-hover:translate-x-0.5 transition-all shrink-0" />
                  {t("footer.contact") || "Contact Us"}
                </Link>
              </li>
              <li>
                <Link to="/dealer/dashboard" className="group inline-flex items-center gap-2 text-slate-400 hover:text-neon transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-neon group-hover:translate-x-0.5 transition-all shrink-0" />
                  Dealer Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Newsletter */}
          <div className="flex flex-col gap-6">
            <div>
              <h4 className="font-heading text-sm font-bold text-white mb-5 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-neon" />
                {t("footer.contact_title") || "Contact Info"}
              </h4>
              <div className="space-y-2.5 text-sm text-slate-400">
                {s?.contact_address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-neon shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{s.contact_address}</span>
                  </div>
                )}
                {s?.contact_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-neon shrink-0" />
                    <a href={`tel:${s.contact_phone}`} className="hover:text-white transition-colors">
                      {s.contact_phone}
                    </a>
                  </div>
                )}
                {s?.contact_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-neon shrink-0" />
                    <a href={`mailto:${s.contact_email}`} className="hover:text-white transition-colors truncate">
                      {s.contact_email}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neon/5 rounded-bl-full pointer-events-none group-hover:bg-neon/10 transition-colors" />
              <h5 className="font-heading text-xs font-bold text-white mb-1.5 uppercase tracking-wider relative z-10">
                {t("newsletter.title") || "Join Newsletter"}
              </h5>
              <p className="text-[11px] text-slate-400 mb-4 relative z-10">
                {t("newsletter.subtitle") || "Get the latest updates and exclusive offers."}
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2 relative z-10">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={t("newsletter.placeholder") || "Email address"}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-neon transition-colors"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-neon text-white hover:bg-neon-glow hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all flex items-center justify-center shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom copyright & back to top strip */}
      <div className="border-t border-slate-800/80 bg-slate-950 relative z-10">
        <div className="container mx-auto px-4 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <p className="text-xs text-slate-500">
              {s?.footer_copyright || "© 2026 kkkparts.com All rights reserved."}
            </p>
            <p className="text-[11px] text-slate-600">
              Designed & Developed by{" "}
              <a
                href="https://softzeniqit.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon hover:text-white font-semibold transition-colors"
              >
                SoftZeniq IT
              </a>
            </p>
          </div>

          <button
            onClick={scrollToTop}
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 hover:bg-neon hover:border-neon text-slate-400 hover:text-white text-xs font-semibold transition-all"
          >
            Back to top
            <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
