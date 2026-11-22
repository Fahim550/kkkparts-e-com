import { Link } from "react-router-dom";
import { ChevronRight, ArrowRight } from "lucide-react";
import { DbCategory } from "@/hooks/useCategories";
import { useLanguage } from "@/context/LanguageContext";

interface HomeCategoriesProps {
  categories: DbCategory[];
}

const fallbackImage =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80";

export const HomeCategories = ({ categories }: HomeCategoriesProps) => {
  const { t } = useLanguage();

  const getCategoryImage = (slug: string, imageUrl: string | null) =>
    imageUrl || fallbackImage;

  return (
    <section className="py-8 bg-gray-50/50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-row items-end justify-between mb-8 gap-2">
          <div>
            <span className="text-neon font-body text-[10px] sm:text-xs font-bold tracking-[0.1em] sm:tracking-[0.2em] mb-1 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse"></div>
              Top Categories
            </span>
            <h2 className="heading-display text-[16px] sm:text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight capitalize">
              {String(t("categories.title")).toLowerCase()}
            </h2>
          </div>
          <Link
            to="/parts"
            className="flex items-center gap-1.5 sm:gap-2 font-body text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-[0.1em] text-gray-900 hover:text-neon transition-all group shrink-0 pb-0.5 sm:pb-0"
          >
            {t("categories.all")}{" "}
            <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:bg-neon group-hover:border-neon group-hover:text-white transition-all shadow-sm">
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5">
          {categories.map((cat) => (
            <div key={cat.id} className="group cursor-pointer">
              <Link
                to={`/parts?category=${cat.slug}`}
                className="group flex flex-col w-full h-full bg-white rounded-xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300 border border-border/40"
              >
                {/* Top Image Showcase - matching ProductCard image styling */}
                <div className="relative aspect-square w-full overflow-hidden bg-background">
                  <img
                    src={getCategoryImage(cat.slug, cat.image_url)}
                    alt={cat.name}
                    width="400"
                    height="400"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Distinct Name Bar Plate - covers full height and uniform across all cards */}
                <div className="flex-1 w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900 group-hover:bg-slate-950 transition-colors duration-300 flex items-center justify-between gap-2 relative border-t border-slate-800 min-h-[58px] sm:min-h-[66px]">
                  {/* Top neon accent line on hover */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-transparent group-hover:bg-neon transition-colors duration-300" />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-extrabold text-[11px] sm:text-[13px] md:text-[14px] text-white tracking-wider uppercase leading-tight line-clamp-2 h-[2.5em] flex items-center group-hover:text-blue-400 transition-colors">
                      {cat.name}
                    </h3>
                  </div>

                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 group-hover:bg-neon text-white flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm group-hover:scale-105">
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeCategories;
