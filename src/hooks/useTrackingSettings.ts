import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrackingSettings {
  facebook_pixel_id: string;
  facebook_pixel_enabled: boolean;
  facebook_capi_enabled: boolean;
  facebook_access_token: string;
  facebook_test_event_code: string;
  facebook_api_version: string;
  tiktok_pixel_id: string;
  tiktok_pixel_enabled: boolean;
  tiktok_access_token: string;
  tracking_pageview: boolean;
  tracking_viewcontent: boolean;
  tracking_addtocart: boolean;
  tracking_initiatecheckout: boolean;
  tracking_purchase: boolean;
  tracking_lead: boolean;
  tracking_complete_registration: boolean;
  currency: string;
  default_content_type: string;
}

export const useTrackingSettings = () =>
  useQuery({
    queryKey: ["tracking-settings"],
    queryFn: async (): Promise<TrackingSettings> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select(
          "facebook_pixel_id, facebook_pixel_enabled, facebook_capi_enabled, facebook_access_token, facebook_test_event_code, facebook_api_version, tiktok_pixel_id, tiktok_pixel_enabled, tiktok_access_token, tracking_pageview, tracking_viewcontent, tracking_addtocart, tracking_initiatecheckout, tracking_purchase, tracking_lead, tracking_complete_registration, currency, default_content_type",
        )
        .limit(1)
        .single();
      if (error) throw error;
      return {
        facebook_pixel_id: (data as any).facebook_pixel_id || "",
        facebook_pixel_enabled: (data as any).facebook_pixel_enabled ?? false,
        facebook_capi_enabled: (data as any).facebook_capi_enabled ?? false,
        facebook_access_token: (data as any).facebook_access_token || "",
        facebook_test_event_code: (data as any).facebook_test_event_code || "",
        facebook_api_version: (data as any).facebook_api_version || "v21.0",
        tiktok_pixel_id: (data as any).tiktok_pixel_id || "",
        tiktok_pixel_enabled: (data as any).tiktok_pixel_enabled ?? false,
        tiktok_access_token: (data as any).tiktok_access_token || "",
        tracking_pageview: (data as any).tracking_pageview ?? true,
        tracking_viewcontent: (data as any).tracking_viewcontent ?? true,
        tracking_addtocart: (data as any).tracking_addtocart ?? true,
        tracking_initiatecheckout:
          (data as any).tracking_initiatecheckout ?? true,
        tracking_purchase: (data as any).tracking_purchase ?? true,
        tracking_lead: (data as any).tracking_lead ?? true,
        tracking_complete_registration:
          (data as any).tracking_complete_registration ?? true,
        currency: (data as any).currency || "BDT",
        default_content_type: (data as any).default_content_type || "product",
      };
    },
    staleTime: 30_000,
  });
