import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageContent } from "@/hooks/usePageContents";
import { useSettings } from "@/hooks/useDatabase";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAddContactMessage } from "@/hooks/useContactMessages";

const ContactPage = () => {
  const { data: page, isLoading } = usePageContent("contact");
  const { data: settings } = useSettings();
  const s = Array.isArray(settings) ? settings[0] || {} : settings || {};

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const addMessage = useAddContactMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      await addMessage.mutateAsync({
        name: form.name,
        email: form.email,
        subject: form.subject || null,
        message: form.message,
      });
      toast.success("Thank you! Your message has been sent successfully.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      console.error("Contact Form Error:", error);
      toast.error(
        error?.message || "Failed to send message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-body text-gray-900">
      <Navbar />

      {/* =========================================
          CLEAN PREMIUM HERO
          ========================================= */}
      <div className="bg-[#F8F9FA] pt-40 lg:pt-48 pb-20 border-b border-gray-100 relative overflow-hidden">
        {/* Soft Background Blur Elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] bg-white rounded-full shadow-[0_0_100px_rgba(0,0,0,0.03)] z-0 pointer-events-none"></div>

        <div className="container mx-auto px-4 lg:px-8 max-w-4xl relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#111] mb-6">
              {isLoading ? (
                <Loader2 className="w-10 h-10 animate-spin text-gray-400 mx-auto" />
              ) : (
                page?.page_title || "Contact Us"
              )}
            </h1>
            <div className="w-20 h-1.5 bg-blue-600 mx-auto mb-8 rounded-full"></div>

            {page?.content ? (
              <div className="max-w-2xl mx-auto space-y-4">
                {page.content.split("\n").map((paragraph, i) =>
                  paragraph.trim() ? (
                    <p
                      key={i}
                      className="text-lg text-gray-500 leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ) : null,
                )}
              </div>
            ) : (
              <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
                We would love to hear from you! Reach out to us through any of
                the following channels. Our team is available Saturday to
                Thursday to assist you.
              </p>
            )}
          </motion.div>
        </div>
      </div>

      <div className="py-16 md:py-24 bg-white relative z-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            {/* =========================================
                LEFT: CONTACT INFO CARDS
                ========================================= */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-8"
            >
              <h3 className="text-3xl md:text-4xl font-extrabold text-[#111] leading-tight mb-2">
                Get in Touch
              </h3>

              <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-5">
                {s?.contact_email && (
                  <a
                    href={`mailto:${s.contact_email}`}
                    className="flex items-center gap-5 p-5 bg-[#F8F9FA] border border-gray-100 rounded-2xl hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-gray-50 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
                        Email
                      </h4>
                      <p className="font-bold text-sm text-[#111] break-all">
                        {s.contact_email}
                      </p>
                    </div>
                  </a>
                )}

                {s?.contact_phone && (
                  <a
                    href={`tel:${s.contact_phone}`}
                    className="flex items-center gap-5 p-5 bg-[#F8F9FA] border border-gray-100 rounded-2xl hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-gray-50 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
                        Phone
                      </h4>
                      <p className="font-bold text-sm text-[#111]">
                        {s.contact_phone}
                      </p>
                    </div>
                  </a>
                )}

                {s?.whatsapp_number && (
                  <a
                    href={`https://wa.me/${s.whatsapp_number.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-5 p-5 bg-[#F8F9FA] border border-gray-100 rounded-2xl hover:bg-white hover:shadow-lg hover:border-[#25D366]/30 hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-gray-50 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-gray-500 group-hover:text-[#25D366] transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
                        WhatsApp
                      </h4>
                      <p className="font-bold text-sm text-[#111]">
                        {s.whatsapp_number}
                      </p>
                    </div>
                  </a>
                )}

                {s?.contact_address && (
                  <div className="flex items-center gap-5 p-5 bg-[#F8F9FA] border border-gray-100 rounded-2xl hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-gray-50 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-gray-500 group-hover:text-red-500 transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
                        Address
                      </h4>
                      <p className="font-bold text-sm text-[#111]">
                        {s.contact_address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* =========================================
                RIGHT: CLEAN CONTACT FORM
                ========================================= */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-3"
            >
              <div className="bg-white border border-gray-100 p-8 md:p-10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] h-full flex flex-col justify-center">
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#111] mb-2">
                  Send a Message
                </h3>
                <p className="text-sm text-gray-500 mb-8 font-medium">
                  Fill out the form below and we'll get back to you as soon as
                  possible.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 pl-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="w-full px-5 py-3.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#111] font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400 shadow-sm"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 pl-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        className="w-full px-5 py-3.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#111] font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400 shadow-sm"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 pl-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) =>
                        setForm({ ...form, subject: e.target.value })
                      }
                      className="w-full px-5 py-3.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#111] font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400 shadow-sm"
                      placeholder="How can we help?"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 pl-1">
                      Message *
                    </label>
                    <textarea
                      required
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                      rows={5}
                      className="w-full px-5 py-3.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#111] font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none placeholder:text-gray-400 shadow-sm"
                      placeholder="Write your message here..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-[#111] text-white py-4 rounded-xl font-bold tracking-wide hover:bg-blue-600 transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                  >
                    {sending ? "Sending..." : "Send Message"}
                    {!sending && <Send className="w-4 h-4 ml-1" />}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>

          {/* =========================================
              CLEAN MAP SECTION
              ========================================= */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-20 lg:mt-24 w-full h-[400px] md:h-[450px] bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.05)] relative p-2"
          >
            <div className="w-full h-full rounded-2xl overflow-hidden">
              <iframe
                src="https://maps.google.com/maps?q=Nesto%20Hypermarket%20-%20Dragon%20Mart%202,%20Dubai&t=&z=14&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Live Location"
                className="relative z-0"
              ></iframe>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;
