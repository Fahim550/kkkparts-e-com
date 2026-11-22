import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { DbBanner } from "@/hooks/useDatabase";
import { useLanguage } from "@/context/LanguageContext";

interface HomeHeroProps {
  banners: DbBanner[];
}

const slideVariants = {
  initial: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%" }),
  animate: { x: 0, transition: { duration: 0.8, ease: "easeInOut" } },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    transition: { duration: 0.8, ease: "easeInOut" },
  }),
};

export const HomeHero = ({ banners }: HomeHeroProps) => {
  const { t } = useLanguage();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [direction, setDirection] = useState(1);

  const heroBanners = banners.filter((b) => b.position === "hero");
  const promoBanners = banners.filter((b) => b.position === "promo");

  const nextBanner = useCallback(() => {
    if (heroBanners.length > 1) {
      setDirection(1);
      setCurrentBanner((prev) => (prev + 1) % heroBanners.length);
    }
  }, [heroBanners.length]);

  const prevBanner = useCallback(() => {
    if (heroBanners.length > 1) {
      setDirection(-1);
      setCurrentBanner(
        (prev) => (prev - 1 + heroBanners.length) % heroBanners.length,
      );
    }
  }, [heroBanners.length]);

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(nextBanner, 5000);
    return () => clearInterval(interval);
  }, [heroBanners.length, nextBanner]);

  return (
    <section className="pt-22 sm:pt-24 lg:pt-30 bg-background relative">
      <div className="w-full px-0 lg:px-0">
        <div
          className={
            promoBanners.length > 0
              ? "grid grid-cols-1 lg:grid-cols-3 gap-4"
              : "w-full"
          }
        >
          {/* Main Slider */}
          <div
            className={`group relative w-full overflow-hidden ${
              promoBanners.length > 0 ? "lg:col-span-2" : "w-full"
            } aspect-[3/2] sm:aspect-[16/10] md:aspect-[16/9] max-w-[1500px] mx-auto`}
          >
            {heroBanners.length > 0 ? (
              <>
                <AnimatePresence initial={false} custom={direction}>
                  <motion.div
                    key={currentBanner}
                    custom={direction}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute inset-0"
                  >
                    {heroBanners[currentBanner].link_url &&
                    !(
                      heroBanners[currentBanner].title?.trim() ||
                      heroBanners[currentBanner].subtitle?.trim()
                    ) ? (
                      <Link
                        to={heroBanners[currentBanner].link_url!}
                        className="block w-full h-full cursor-pointer"
                      >
                        <img
                          src={heroBanners[currentBanner].image_url}
                          alt={
                            heroBanners[currentBanner].title?.trim() || "Banner"
                          }
                          decoding="async"
                          className="w-full h-full object-cover sm:object-cover"
                        />
                      </Link>
                    ) : (
                      <>
                        <img
                          src={heroBanners[currentBanner].image_url}
                          alt={
                            heroBanners[currentBanner].title?.trim() || "Banner"
                          }
                          decoding="async"
                          className="w-full h-full object-cover sm:object-cover"
                        />
                        {(heroBanners[currentBanner].title?.trim() ||
                          heroBanners[currentBanner].subtitle?.trim()) && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent md:bg-gradient-to-r md:from-black/90 md:via-black/40 md:to-transparent" />
                        )}
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                {(heroBanners[currentBanner].title?.trim() ||
                  heroBanners[currentBanner].subtitle?.trim()) && (
                  <div className="absolute inset-0 p-5 md:p-16 flex flex-col justify-center z-10 text-primary-foreground pointer-events-none">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                      className="container mx-auto px-2 lg:px-12 pointer-events-auto"
                    >
                      <div className="p-6 md:p-10 max-w-2xl inline-block">
                        {heroBanners[currentBanner].title?.trim() && (
                          <h1 className="heading-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4 text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                            {heroBanners[currentBanner].title}
                          </h1>
                        )}
                        {heroBanners[currentBanner].subtitle?.trim() && (
                          <p className="text-gray-100 font-body text-base sm:text-xl mb-8 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] font-medium">
                            {heroBanners[currentBanner].subtitle}
                          </p>
                        )}
                        {heroBanners[currentBanner].link_url && (
                          <Link
                            to={heroBanners[currentBanner].link_url!}
                            className="inline-flex items-center gap-3 bg-neon text-accent-foreground px-8 py-4 font-body text-[15px] font-bold tracking-widest uppercase hover:bg-white hover:text-black hover:scale-105 transition-all duration-300 rounded-full shadow-[0_10px_30px_rgba(var(--neon-rgb),0.5)]"
                          >
                            {t("hero.shop_now")}{" "}
                            <ArrowRight className="w-5 h-5" />
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  </div>
                )}

                {heroBanners.length > 1 && (
                  <>
                    <button
                      onClick={prevBanner}
                      aria-label="Previous banner"
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-neon hover:text-black transition-all duration-300 border border-white/20 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 shadow-xl"
                    >
                      <ChevronLeft className="w-7 h-7 transition-colors" />
                    </button>
                    <button
                      onClick={nextBanner}
                      aria-label="Next banner"
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-neon hover:text-black transition-all duration-300 border border-white/20 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 shadow-xl"
                    >
                      <ChevronRight className="w-7 h-7 transition-colors" />
                    </button>
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                      {heroBanners.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setDirection(i > currentBanner ? 1 : -1);
                            setCurrentBanner(i);
                          }}
                          aria-label={`Go to banner ${i + 1}`}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            i === currentBanner
                              ? "w-10 bg-neon"
                              : "w-2 bg-white/50 hover:bg-white/80"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="absolute inset-0 p-5 md:p-16 flex flex-col justify-center z-10 text-primary-foreground pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="container mx-auto px-2 lg:px-12 pointer-events-auto"
                >
                  <div className="bg-black/40 backdrop-blur-md p-6 md:p-10 rounded-2xl border border-white/10 max-w-xl inline-block shadow-2xl">
                    <h1 className="heading-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-3 text-white drop-shadow-xl">
                      {t("hero.fuel")}
                      <br />
                      <span className="text-neon text-glow">
                        {t("hero.game")}
                      </span>
                    </h1>
                    <p className="text-gray-200 font-body text-base sm:text-lg mb-8 drop-shadow-md">
                      {t("hero.subtitle")}
                    </p>
                    <Link
                      to="/parts"
                      className="inline-flex items-center gap-2 bg-neon text-accent-foreground px-8 py-4 font-body text-sm font-bold tracking-widest uppercase hover:bg-neon-glow transition-all duration-300 rounded-md shadow-[0_0_15px_rgba(var(--neon),0.4)]"
                    >
                      {t("hero.shop_now")} <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          {/* Side Promo Banners (Right) */}
          {promoBanners.length > 0 && (
            <div className="flex flex-col gap-4 h-full pr-0 lg:pr-4">
              {promoBanners.slice(0, 2).map((b) => (
                <Link
                  key={b.id}
                  to={b.link_url || "/parts"}
                  className="group relative w-full h-[200px] lg:h-[calc(50%-0.5rem)] overflow-hidden block border-l-4 border-transparent hover:border-neon transition-all duration-300"
                >
                  <img
                    src={b.image_url}
                    alt={b.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="font-heading text-xl md:text-2xl font-bold uppercase text-white drop-shadow-lg">
                      {b.title}
                    </h3>
                    {b.subtitle && (
                      <p className="font-body text-sm text-gray-300 mt-2 drop-shadow-md">
                        {b.subtitle}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
