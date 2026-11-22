import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const reviews = [
  {
    name: "Khalid A.",
    text: "Authentic auto parts, fast shipping. Best car accessories store in Oman!",
    rating: 5,
  },
  {
    name: "Fatima R.",
    text: "Got my brake pads in 2 days. Perfect fit and 100% genuine.",
    rating: 5,
  },
  {
    name: "Mohammed S.",
    text: "Great selection of brands. My car is running smoothly now.",
    rating: 5,
  },
];

export const HomeReviews = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-neon font-body text-sm font-bold tracking-[0.2rem] uppercase">
            {t("reviews.label")}
          </span>
          <h2 className="heading-display text-2xl md:text-2xl font-bold mt-2 text-foreground">
            {t("reviews.title")}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-8 border border-border rounded-lg hover:border-neon/20 hover:shadow-md transition-all"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-neon text-neon" />
                ))}
              </div>
              <p className="font-body text-sm text-muted-foreground mb-4 leading-relaxed">
                "{review.text}"
              </p>
              <p className="font-heading font-bold text-sm uppercase tracking-wider text-foreground">
                {review.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeReviews;
