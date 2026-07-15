import { useEffect, useState } from "react";
import { ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const names = [
  "Ahmed",
  "Sara",
  "Mohammed",
  "Fatima",
  "Omar",
  "Nour",
  "Khalid",
  "Hessa",
  "Yousef",
  "Maryam",
  "Ali",
  "Dalal",
  "Hassan",
  "Reem",
  "Faisal",
  "Lina",
  "Abdulaziz",
  "Noura",
  "Bader",
  "Shaikha",
  "Jaber",
  "Aisha",
  "Nasser",
  "Dana",
];

const cities = [
  "Downtown Dubai",
  "Dubai Marina",
  "Jumeirah",
  "Deira",
  "Bur Dubai",
  "Business Bay",
  "Al Barsha",
  "JLT",
];

const timeAgo = [
  "2 minutes ago",
  "5 minutes ago",
  "8 minutes ago",
  "12 minutes ago",
  "15 minutes ago",
  "20 minutes ago",
  "1 minute ago",
  "3 minutes ago",
];

const FakePurchaseNotification = ({
  productNames,
}: {
  productNames: string[];
}) => {
  const [visible, setVisible] = useState(false);
  const [notification, setNotification] = useState({
    name: "",
    city: "",
    product: "",
    time: "",
  });

  useEffect(() => {
    const show = () => {
      const name = names[Math.floor(Math.random() * names.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const product =
        productNames.length > 0
          ? productNames[Math.floor(Math.random() * productNames.length)]
          : "a product";
      const time = timeAgo[Math.floor(Math.random() * timeAgo.length)];
      setNotification({ name, city, product, time });
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    };

    const initialDelay = setTimeout(show, 5000);
    const interval = setInterval(show, 10000);
    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [productNames]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          className="fixed bottom-4 left-4 z-50 max-w-xs bg-card border border-border rounded-lg shadow-lg p-3 flex items-start gap-3"
        >
          <div className="bg-neon/10 p-2 rounded-full shrink-0">
            <ShoppingBag className="w-4 h-4 text-neon" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-xs font-bold text-foreground truncate">
              {notification.name} from {notification.city}
            </p>
            <p className="font-body text-xs text-muted-foreground truncate">
              purchased{" "}
              <span className="font-semibold text-foreground">
                {notification.product}
              </span>
            </p>
            <p className="font-body text-[10px] text-muted-foreground mt-0.5">
              {notification.time}
            </p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FakePurchaseNotification;
