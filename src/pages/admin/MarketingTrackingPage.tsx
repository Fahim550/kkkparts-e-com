import { useState, useEffect } from "react";
import { useTrackingSettings } from "@/hooks/useTrackingSettings";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Send } from "lucide-react";

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-2">
    <span className="font-body text-sm text-foreground">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const MarketingTrackingPage = () => {
  const { data: settings, isLoading } = useTrackingSettings();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showTiktokToken, setShowTiktokToken] = useState(false);

  const [form, setForm] = useState({
    facebook_pixel_id: "",
    facebook_pixel_enabled: false,
    facebook_capi_enabled: false,
    facebook_access_token: "",
    facebook_test_event_code: "",
    facebook_api_version: "v21.0",
    tiktok_pixel_id: "",
    tiktok_pixel_enabled: false,
    tiktok_access_token: "",
    tracking_pageview: true,
    tracking_viewcontent: true,
    tracking_addtocart: true,
    tracking_initiatecheckout: true,
    tracking_purchase: true,
    tracking_lead: true,
    tracking_complete_registration: true,
    default_content_type: "product",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        facebook_pixel_id: settings.facebook_pixel_id,
        facebook_pixel_enabled: settings.facebook_pixel_enabled,
        facebook_capi_enabled: settings.facebook_capi_enabled,
        facebook_access_token: settings.facebook_access_token,
        facebook_test_event_code: settings.facebook_test_event_code,
        facebook_api_version: settings.facebook_api_version,
        tiktok_pixel_id: settings.tiktok_pixel_id,
        tiktok_pixel_enabled: settings.tiktok_pixel_enabled,
        tiktok_access_token: settings.tiktok_access_token,
        tracking_pageview: settings.tracking_pageview,
        tracking_viewcontent: settings.tracking_viewcontent,
        tracking_addtocart: settings.tracking_addtocart,
        tracking_initiatecheckout: settings.tracking_initiatecheckout,
        tracking_purchase: settings.tracking_purchase,
        tracking_lead: settings.tracking_lead,
        tracking_complete_registration: settings.tracking_complete_registration,
        default_content_type: settings.default_content_type,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (form.facebook_pixel_enabled && !form.facebook_pixel_id.trim()) {
      toast.error("Pixel ID is required when Facebook Pixel is enabled");
      return;
    }
    if (form.facebook_capi_enabled && !form.facebook_access_token.trim()) {
      toast.error("Access Token is required when Facebook CAPI is enabled");
      return;
    }
    if (form.tiktok_pixel_enabled && !form.tiktok_pixel_id.trim()) {
      toast.error("Pixel ID is required when TikTok Pixel is enabled");
      return;
    }

    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .limit(1)
        .maybeSingle();
      if (!existing?.id) {
        const { error } = await supabase
          .from("site_settings")
          .insert([form as any]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .update(form as any)
          .eq("id", existing.id);
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["tracking-settings"] });
      toast.success("Marketing tracking settings saved!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEvent = async () => {
    if (!form.facebook_pixel_id || !form.facebook_access_token) {
      toast.error("Pixel ID and Access Token are required to test");
      return;
    }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("facebook-capi", {
        body: {
          event_name: "PageView",
          event_id: `test-${Date.now()}`,
          event_source_url: window.location.href,
          event_time: Math.floor(Date.now() / 1000),
          custom_data: {},
          user_data: {},
          is_test: true,
        },
      });
      if (error) throw error;
      toast.success("Test event sent! Check your Meta Events Manager.");
    } catch (e: any) {
      toast.error(`Test failed: ${e.message || "Unknown error"}`);
    } finally {
      setTesting(false);
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
          Marketing Tracking
        </h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Facebook Pixel, TikTok Pixel & Conversion API Settings
        </p>
      </div>

      <div className="w-full space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Facebook Pixel Settings */}
            <div className="bg-card border border-border p-6 rounded-lg">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
                Facebook Pixel
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Pixel ID
                  </label>
                  <Input
                    value={form.facebook_pixel_id}
                    onChange={(e) =>
                      setForm({ ...form, facebook_pixel_id: e.target.value })
                    }
                    placeholder="e.g. 123456789012345"
                  />
                  <p className="font-body text-xs text-muted-foreground mt-1">
                    Find this in your Meta Events Manager
                  </p>
                </div>
                <Toggle
                  label="Enable Facebook Pixel"
                  checked={form.facebook_pixel_enabled}
                  onChange={(v) =>
                    setForm({ ...form, facebook_pixel_enabled: v })
                  }
                />
              </div>
            </div>

            {/* Facebook CAPI Settings */}
            <div className="bg-card border border-border p-6 rounded-lg">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
                Facebook Conversion API (CAPI)
              </h3>
              <div className="space-y-4">
                <Toggle
                  label="Enable Conversion API"
                  checked={form.facebook_capi_enabled}
                  onChange={(v) =>
                    setForm({ ...form, facebook_capi_enabled: v })
                  }
                />
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Meta Access Token
                  </label>
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      value={form.facebook_access_token}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          facebook_access_token: e.target.value,
                        })
                      }
                      placeholder="EAAxxxxxxxxx..."
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showToken ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Test Event Code
                  </label>
                  <Input
                    value={form.facebook_test_event_code}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        facebook_test_event_code: e.target.value,
                      })
                    }
                    placeholder="TEST12345"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    API Version
                  </label>
                  <Input
                    value={form.facebook_api_version}
                    onChange={(e) =>
                      setForm({ ...form, facebook_api_version: e.target.value })
                    }
                    placeholder="v21.0"
                  />
                </div>
              </div>
            </div>

            {/* TikTok Pixel Settings */}
            <div className="bg-card border border-border p-6 rounded-lg">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
                TikTok Pixel
              </h3>
              <div className="space-y-4">
                <Toggle
                  label="Enable TikTok Pixel"
                  checked={form.tiktok_pixel_enabled}
                  onChange={(v) =>
                    setForm({ ...form, tiktok_pixel_enabled: v })
                  }
                />
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    TikTok Pixel ID
                  </label>
                  <Input
                    value={form.tiktok_pixel_id}
                    onChange={(e) =>
                      setForm({ ...form, tiktok_pixel_id: e.target.value })
                    }
                    placeholder="e.g. D7F9CR3C77U97DR2O8BG"
                  />
                  <p className="font-body text-xs text-muted-foreground mt-1">
                    Find this in your TikTok Ads Manager → Events
                  </p>
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    TikTok Access Token
                  </label>
                  <div className="relative">
                    <Input
                      type={showTiktokToken ? "text" : "password"}
                      value={form.tiktok_access_token}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          tiktok_access_token: e.target.value,
                        })
                      }
                      placeholder="Access token..."
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTiktokToken(!showTiktokToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showTiktokToken ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="font-body text-xs text-muted-foreground mt-1">
                    Optional — for TikTok Events API server-side tracking
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Event Toggles */}
            <div className="bg-card border border-border p-6 rounded-lg">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
                Event Tracking Toggles
              </h3>
              <div className="divide-y divide-border">
                <Toggle
                  label="PageView"
                  checked={form.tracking_pageview}
                  onChange={(v) => setForm({ ...form, tracking_pageview: v })}
                />
                <Toggle
                  label="ViewContent (Product Page)"
                  checked={form.tracking_viewcontent}
                  onChange={(v) =>
                    setForm({ ...form, tracking_viewcontent: v })
                  }
                />
                <Toggle
                  label="AddToCart"
                  checked={form.tracking_addtocart}
                  onChange={(v) => setForm({ ...form, tracking_addtocart: v })}
                />
                <Toggle
                  label="InitiateCheckout"
                  checked={form.tracking_initiatecheckout}
                  onChange={(v) =>
                    setForm({ ...form, tracking_initiatecheckout: v })
                  }
                />
                <Toggle
                  label="Purchase"
                  checked={form.tracking_purchase}
                  onChange={(v) => setForm({ ...form, tracking_purchase: v })}
                />
                <Toggle
                  label="Lead"
                  checked={form.tracking_lead}
                  onChange={(v) => setForm({ ...form, tracking_lead: v })}
                />
                <Toggle
                  label="CompleteRegistration"
                  checked={form.tracking_complete_registration}
                  onChange={(v) =>
                    setForm({ ...form, tracking_complete_registration: v })
                  }
                />
              </div>
            </div>

            {/* Advanced */}
            <div className="bg-card border border-border p-6 rounded-lg">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
                Advanced
              </h3>
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Default Content Type
                </label>
                <Input
                  value={form.default_content_type}
                  onChange={(e) =>
                    setForm({ ...form, default_content_type: e.target.value })
                  }
                  placeholder="product"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          <button
            onClick={handleTestEvent}
            disabled={testing || !form.facebook_capi_enabled}
            className="flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-md font-body text-sm font-bold tracking-wider uppercase hover:bg-muted transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {testing ? "Sending..." : "Send Test Event (Facebook)"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketingTrackingPage;
