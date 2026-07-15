import { useCallback } from "react";
import { useTrackingSettings } from "@/hooks/useTrackingSettings";
import {
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
  trackLead,
  trackCompleteRegistration,
} from "@/lib/facebook-pixel";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook that provides tracking functions gated by admin settings.
 * Fires browser pixel + optional server CAPI event.
 */
export const useFacebookTracking = () => {
  const { data: settings } = useTrackingSettings();

  const sendServerEvent = useCallback(
    async (
      eventName: string,
      eventId: string,
      customData: Record<string, any>,
      userData?: Record<string, any>,
    ) => {
      if (!settings?.facebook_capi_enabled) return;
      try {
        await supabase.functions.invoke("facebook-capi", {
          body: {
            event_name: eventName,
            event_id: eventId,
            event_source_url: window.location.href,
            event_time: Math.floor(Date.now() / 1000),
            custom_data: customData,
            user_data: userData || {},
          },
        });
      } catch (e) {
        console.warn("CAPI event failed:", e);
      }
    },
    [settings?.facebook_capi_enabled],
  );

  const fireEvent = useCallback(
    (
      eventName: string,
      browserTrackFn: (data: Record<string, any>) => string,
      data: Record<string, any>,
    ) => {
      const capiEnabled = settings?.facebook_capi_enabled;
      if (capiEnabled) {
        // Server-only: generate ID and send via CAPI (avoids duplicate with browser pixel)
        const eventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sendServerEvent(eventName, eventId, data);
      } else {
        // Browser-only: fire pixel
        browserTrackFn(data);
      }
    },
    [settings?.facebook_capi_enabled, sendServerEvent],
  );

  const fbTrackViewContent = useCallback(
    (params: {
      content_ids: string[];
      content_name: string;
      content_category: string;
      value: number;
    }) => {
      if (!settings?.facebook_pixel_enabled || !settings?.tracking_viewcontent)
        return;
      const currency = settings.currency || "BDT";
      const contentType = settings.default_content_type || "product";
      const data = { ...params, currency, content_type: contentType };
      fireEvent("ViewContent", (d) => trackViewContent(d as any), data);
    },
    [settings, fireEvent],
  );

  const fbTrackAddToCart = useCallback(
    (params: {
      content_ids: string[];
      content_name: string;
      value: number;
      num_items?: number;
    }) => {
      if (!settings?.facebook_pixel_enabled || !settings?.tracking_addtocart)
        return;
      const currency = settings.currency || "BDT";
      const contentType = settings.default_content_type || "product";
      const data = { ...params, currency, content_type: contentType };
      fireEvent("AddToCart", (d) => trackAddToCart(d as any), data);
    },
    [settings, fireEvent],
  );

  const fbTrackInitiateCheckout = useCallback(
    (params: { content_ids: string[]; value: number; num_items: number }) => {
      if (
        !settings?.facebook_pixel_enabled ||
        !settings?.tracking_initiatecheckout
      )
        return;
      const currency = settings.currency || "BDT";
      const contentType = settings.default_content_type || "product";
      const data = { ...params, currency, content_type: contentType };
      fireEvent(
        "InitiateCheckout",
        (d) => trackInitiateCheckout(d as any),
        data,
      );
    },
    [settings, fireEvent],
  );

  const fbTrackPurchase = useCallback(
    (params: {
      content_ids: string[];
      value: number;
      num_items: number;
      order_id?: string;
    }) => {
      if (!settings?.facebook_pixel_enabled || !settings?.tracking_purchase)
        return;
      const currency = settings.currency || "BDT";
      const contentType = settings.default_content_type || "product";
      const data = { ...params, currency, content_type: contentType };
      fireEvent("Purchase", (d) => trackPurchase(d as any), data);
    },
    [settings, fireEvent],
  );

  const fbTrackLead = useCallback(
    (params?: { value?: number }) => {
      if (!settings?.facebook_pixel_enabled || !settings?.tracking_lead) return;
      const currency = settings.currency || "BDT";
      const data = { ...params, currency };
      fireEvent("Lead", (d) => trackLead(d as any), data);
    },
    [settings, fireEvent],
  );

  const fbTrackCompleteRegistration = useCallback(
    (params?: { value?: number; status?: string }) => {
      if (
        !settings?.facebook_pixel_enabled ||
        !settings?.tracking_complete_registration
      )
        return;
      const currency = settings.currency || "BDT";
      const data = { ...params, currency };
      fireEvent(
        "CompleteRegistration",
        (d) => trackCompleteRegistration(d as any),
        data,
      );
    },
    [settings, fireEvent],
  );

  return {
    fbTrackViewContent,
    fbTrackAddToCart,
    fbTrackInitiateCheckout,
    fbTrackPurchase,
    fbTrackLead,
    fbTrackCompleteRegistration,
  };
};
