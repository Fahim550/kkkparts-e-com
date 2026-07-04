import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PageTitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = "Oman Auto Parts";

    if (path === "/") {
      title = "Home | Oman Auto Parts";
    } else if (path === "/parts") {
      const searchParams = new URLSearchParams(location.search);
      const category = searchParams.get('category');
      if (category) {
        title = `${category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')} | Oman Auto Parts`;
      } else {
        title = "Shop Parts | Oman Auto Parts";
      }
    } else if (path.startsWith("/product/")) {
      title = "Product Details | Oman Auto Parts";
    } else if (path === "/cart") {
      title = "Your Cart | Oman Auto Parts";
    } else if (path === "/checkout") {
      title = "Checkout | Oman Auto Parts";
    } else if (path === "/wishlist") {
      title = "Wishlist | Oman Auto Parts";
    } else if (path === "/about") {
      title = "About Us | Oman Auto Parts";
    } else if (path === "/contact") {
      title = "Contact Us | Oman Auto Parts";
    } else if (path === "/careers") {
      title = "Careers | Oman Auto Parts";
    } else if (path === "/dealer/login" || path === "/dealer/register") {
      title = "Dealer Portal | Oman Auto Parts";
    } else if (path === "/dealer/dashboard") {
      title = "Dealer Dashboard | Oman Auto Parts";
    } else if (path.startsWith("/admin")) {
      title = "Admin Panel | Oman Auto Parts";
    }

    document.title = title;
  }, [location]);

  return null;
};

export default PageTitleUpdater;
