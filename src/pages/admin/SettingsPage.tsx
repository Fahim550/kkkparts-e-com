import { useSettings, useUpdateSettings } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";
import { uploadProductImage } from "@/lib/image-upload";
import { Loader2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const Field = ({
  label,
  field,
  form,
  setForm,
  type = "text",
  placeholder = "",
}: {
  label: string;
  field: string;
  form: any;
  setForm: any;
  type?: string;
  placeholder?: string;
}) => (
  <div>
    <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
      {label}
    </label>
    <input
      type={type}
      value={form[field]}
      onChange={(e) =>
        setForm({
          ...form,
          [field]: type === "number" ? +e.target.value : e.target.value,
        })
      }
      placeholder={placeholder}
      className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
    />
  </div>
);

const TextArea = ({
  label,
  field,
  form,
  setForm,
  rows = 2,
}: {
  label: string;
  field: string;
  form: any;
  setForm: any;
  rows?: number;
}) => (
  <div>
    <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
      {label}
    </label>
    <textarea
      value={form[field]}
      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
      rows={rows}
      className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary resize-none"
    />
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-card border border-border p-6 rounded-lg">
    <h3 className="font-heading text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const SettingsPage = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const s = Array.isArray(settings) ? settings[0] || {} : settings || {};
  const [form, setForm] = useState({
    site_name: "",
    site_description: "",
    meta_title: "",
    meta_description: "",
    whatsapp_number: "",
    instagram_handle: "",
    free_shipping_threshold: 30,
    currency: "OMR",
    language: "en",
    logo_url: "",
    favicon_url: "",
    footer_description: "",
    footer_copyright: "",
    footer_tagline: "",
    contact_email: "",
    contact_phone: "",
    contact_address: "",
    facebook_url: "",
    twitter_url: "",
    youtube_url: "",
    instagram_url: "",
  });

  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setForm({
        site_name: s.site_name || "",
        site_description: s.site_description || "",
        meta_title: s.meta_title || "",
        meta_description: s.meta_description || "",
        whatsapp_number: s.whatsapp_number || "",
        instagram_handle: s.instagram_handle || "",
        free_shipping_threshold: Number(s.free_shipping_threshold) || 30,
        currency: s.currency || "OMR",
        language: s.language || "en",
        logo_url: s.logo_url || "/logo.png",
        favicon_url: s.favicon_url || "/favicon.ico",
        footer_description: s.footer_description || "",
        footer_copyright: s.footer_copyright || "",
        footer_tagline: s.footer_tagline || "",
        contact_email: s.contact_email || "",
        contact_phone: s.contact_phone || "",
        contact_address: s.contact_address || "",
        facebook_url: s.facebook_url || "",
        twitter_url: s.twitter_url || "",
        youtube_url: s.youtube_url || "",
        instagram_url: s.instagram_url || "",
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let targetId = s?.id;
      if (!targetId) {
        const { data: existing } = await supabase
          .from("site_settings")
          .select("id")
          .limit(1)
          .maybeSingle();
        targetId = existing?.id;
      }

      if (!targetId) {
        const { error } = await supabase
          .from("site_settings")
          .insert([{ ...form }]);
        if (error) throw error;
      } else {
        await updateSettings.mutateAsync({ id: targetId, ...form });
      }

      toast.success("Settings saved");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const url = await uploadProductImage(file, "logo");
      setForm((f) => ({ ...f, logo_url: url }));
      toast.success("Logo uploaded");
    } catch {
      toast.error("Logo upload failed");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleFaviconUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFaviconUploading(true);
    try {
      const url = await uploadProductImage(file, "favicon");
      setForm((f) => ({ ...f, favicon_url: url }));
      toast.success("Favicon uploaded");
    } catch {
      toast.error("Favicon upload failed");
    } finally {
      setFaviconUploading(false);
    }
  };

  if (isLoading)
    return (
      <p className="text-center py-10 text-muted-foreground">Loading...</p>
    );

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-foreground">
          Settings
        </h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Store configuration, branding & SEO
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-8">
            <Section title="Store Identity">
              <Field
                label="Shop / Business Name (Prints on Invoices & Receipts)"
                field="site_name"
                placeholder="e.g. MULTAQA QURIYATH TRAD"
                form={form}
                setForm={setForm}
              />
              <Field
                label="Commercial Registration (C.R. No) / Tax ID (Prints on Invoices)"
                field="site_description"
                placeholder="e.g. 1144157"
                form={form}
                setForm={setForm}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Logo URL
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={logoRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoRef.current?.click()}
                      disabled={logoUploading}
                      className="flex items-center gap-2 px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-50 shrink-0"
                    >
                      {logoUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {logoUploading ? "Uploading..." : "Upload"}
                    </button>
                    <input
                      type="text"
                      value={form.logo_url}
                      onChange={(e) =>
                        setForm({ ...form, logo_url: e.target.value })
                      }
                      placeholder="/logo.png"
                      className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Favicon URL
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={faviconRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFaviconUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => faviconRef.current?.click()}
                      disabled={faviconUploading}
                      className="flex items-center gap-2 px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-50 shrink-0"
                    >
                      {faviconUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {faviconUploading ? "Uploading..." : "Upload"}
                    </button>
                    <input
                      type="text"
                      value={form.favicon_url}
                      onChange={(e) =>
                        setForm({ ...form, favicon_url: e.target.value })
                      }
                      placeholder="/favicon.ico"
                      className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
              {form.logo_url && (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-secondary rounded-md">
                    <img
                      src={form.logo_url}
                      alt="Logo preview"
                      className="h-10 w-auto"
                    />
                  </div>
                  <span className="font-body text-xs text-muted-foreground">
                    Logo preview
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Currency"
                  field="currency"
                  form={form}
                  setForm={setForm}
                />
                <Field
                  label="Free Shipping Min"
                  field="free_shipping_threshold"
                  type="number"
                  form={form}
                  setForm={setForm}
                />
              </div>
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Website Language
                </label>
                <select
                  value={form.language}
                  onChange={(e) =>
                    setForm({ ...form, language: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="en">English</option>
                </select>
              </div>
            </Section>

            <Section title="Contact Information (Printed on Invoices & Receipts)">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Contact Email"
                  field="contact_email"
                  placeholder="mohammaddawood19931@gmail.com"
                  form={form}
                  setForm={setForm}
                />
                <Field
                  label="Contact Phone"
                  field="contact_phone"
                  placeholder="79458035"
                  form={form}
                  setForm={setForm}
                />
              </div>
              <Field
                label="Shop Address"
                field="contact_address"
                placeholder="QURIYATH SANAYYA, SULTANATE OF OMAN"
                form={form}
                setForm={setForm}
              />
              <Field
                label="WhatsApp Number"
                field="whatsapp_number"
                placeholder="+968 79458035"
                form={form}
                setForm={setForm}
              />
            </Section>
          </div>

          <div className="space-y-8">
            <Section title="SEO Settings">
              <Field
                label="Meta Title"
                field="meta_title"
                form={form}
                setForm={setForm}
              />
              <p className="font-body text-xs text-muted-foreground -mt-3">
                {form.meta_title.length}/60 characters
              </p>
              <TextArea
                label="Meta Description"
                field="meta_description"
                form={form}
                setForm={setForm}
              />
              <p className="font-body text-xs text-muted-foreground -mt-3">
                {form.meta_description.length}/160 characters
              </p>
            </Section>

            <Section title="Social Media Links">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Instagram URL"
                  field="instagram_url"
                  placeholder="https://instagram.com/..."
                  form={form}
                  setForm={setForm}
                />
                <Field
                  label="Facebook URL"
                  field="facebook_url"
                  placeholder="https://facebook.com/..."
                  form={form}
                  setForm={setForm}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Twitter URL"
                  field="twitter_url"
                  placeholder="https://twitter.com/..."
                  form={form}
                  setForm={setForm}
                />
                <Field
                  label="YouTube URL"
                  field="youtube_url"
                  placeholder="https://youtube.com/..."
                  form={form}
                  setForm={setForm}
                />
              </div>
              <Field
                label="Instagram Handle"
                field="instagram_handle"
                form={form}
                setForm={setForm}
              />
            </Section>

            <Section title="Footer Settings">
              <TextArea
                label="Footer Description"
                field="footer_description"
                form={form}
                setForm={setForm}
              />
              <Field
                label="Copyright Text"
                field="footer_copyright"
                placeholder="© 2026 Store Name. All rights reserved."
                form={form}
                setForm={setForm}
              />
              <Field
                label="Footer Tagline"
                field="footer_tagline"
                placeholder="🇦🇪 Free delivery across Dubai"
                form={form}
                setForm={setForm}
              />
            </Section>
          </div>
        </div>

        <button
          type="submit"
          disabled={updateSettings.isPending}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {updateSettings.isPending ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;
