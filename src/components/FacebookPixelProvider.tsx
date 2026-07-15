import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTrackingSettings } from "@/hooks/useTrackingSettings";
import {
  initFacebookPixel,
  removeFacebookPixel,
  trackPageView,
} from "@/lib/facebook-pixel";

/**
 * Manages Facebook Pixel lifecycle based on admin settings.
 * Place once in the app tree inside <BrowserRouter>.
 */
const FacebookPixelProvider = () => {
  const { data: settings } = useTrackingSettings();
  const location = useLocation();

  // Init or remove pixel based on settings
  useEffect(() => {
    if (!settings) return;
    if (settings.facebook_pixel_enabled && settings.facebook_pixel_id) {
      initFacebookPixel(settings.facebook_pixel_id);
    } else {
      removeFacebookPixel();
    }
  }, [settings?.facebook_pixel_enabled, settings?.facebook_pixel_id]);

  // Track PageView on route change
  useEffect(() => {
    if (!settings?.facebook_pixel_enabled || !settings?.tracking_pageview)
      return;
    trackPageView();
  }, [
    location.pathname,
    settings?.facebook_pixel_enabled,
    settings?.tracking_pageview,
  ]);

  return null;
};

export default FacebookPixelProvider;
