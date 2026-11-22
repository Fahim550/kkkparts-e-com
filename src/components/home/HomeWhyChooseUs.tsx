import { motion } from "framer-motion";
import { Shield, Zap, Truck, RefreshCw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export const HomeWhyChooseUs = () => {
  const { t } = useLanguage();

  const items = [
    {
      icon: Shield,
      title: t("why.authentic"),
      desc: t("why.authentic_desc"),
    },
    {
      icon: Zap,
      title: t("why.performance"),
      desc: t("why.performance_desc"),
    },
    {
      icon: Truck,
      title: t("why.delivery"),
      desc: t("why.delivery_desc"),
    },
    {
      icon: RefreshCw,
      title: t("why.returns"),
      desc: t("why.returns_desc"),
    },
  ];

  return (
    <section className="py-16 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-neon font-body text-sm font-bold tracking-[0.2em] uppercase">
            {t("why.label")}
          </span>
          <h2 className="heading-display text-2xl md:text-2xl font-bold mt-2 text-foreground">
            {t("why.title")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6 bg-background rounded-lg border border-border hover:border-neon/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 mx-auto mb-5 bg-neon/10 rounded-full flex items-center justify-center">
                <item.icon className="w-6 h-6 text-neon" />
              </div>
              <h3 className="font-heading text-md font-bold uppercase tracking-wide mb-2 text-foreground">
                {item.title}
              </h3>
              <p className="font-body text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeWhyChooseUs;
