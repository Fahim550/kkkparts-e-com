import { Star, ThumbsUp, CheckCircle, Users } from "lucide-react";
import { useProductReviews } from "@/hooks/useReviews";
import { motion } from "framer-motion";

const staticReviews = [
  // { id: 'static-1', reviewer_name: 'أحمد ك.', rating: 5, review_text: 'جودة ممتازة! تماماً كما في الوصف. توصيل سريع أيضاً. بالتأكيد سأطلب مرة أخرى.', reviewer_image: '' },
  // { id: 'static-2', reviewer_name: 'سارة م.', rating: 5, review_text: 'أفضل أحذية اشتريتها في الكويت. منتج أصلي وتغليف رائع. أنصح بشدة!', reviewer_image: '' },
  // { id: 'static-3', reviewer_name: 'محمد أ.', rating: 4, review_text: 'مريح جداً وأنيق. أصدقائي يسألونني دائماً من أين اشتريتها. متجر ممتاز!', reviewer_image: '' },
  // { id: 'static-4', reviewer_name: 'فاطمة ر.', rating: 5, review_text: 'مقاس مثالي! اللون تماماً مثل الصور. خدمة العملاء كانت مفيدة جداً.', reviewer_image: '' },
  // { id: 'static-5', reviewer_name: 'عمر ح.', rating: 5, review_text: 'ثالث مرة أطلب من هنا. لم أخيب ظني أبداً. منتجات أصلية 100%.', reviewer_image: '' },
  // { id: 'static-6', reviewer_name: 'نور س.', rating: 4, review_text: 'أحب الجودة! وصل أسرع من المتوقع. سأكون زبون دائم بالتأكيد.', reviewer_image: '' },
];

const ProductReviews = ({ productId }: { productId: string }) => {
  const { data: dbReviews = [] } = useProductReviews(productId);

  const allReviews = [
    ...dbReviews,
    ...staticReviews.filter((sr) => !dbReviews.some((r) => r.id === sr.id)),
  ];

  return (
    <section className="mt-16 pt-10 border-t border-border">
      {/* Social Proof Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-card border border-border rounded-lg p-6 md:p-8 mb-8"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-neon/10 p-3 rounded-full">
              <Users className="w-8 h-8 text-neon" />
            </div>
            <div>
              <h2 className="heading-display text-2xl md:text-3xl font-bold text-foreground">
                2,000+ Reviews
              </h2>
              <p className="font-body text-sm text-muted-foreground">
                Trusted by customers across Dubai
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="w-6 h-6 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <span className="font-heading text-2xl font-bold text-foreground">
              4.8 / 5
            </span>
            <span className="font-body text-xs text-muted-foreground">
              Average Rating
            </span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          {[
            {
              icon: CheckCircle,
              label: "100% Same Authentic",
              value: "Guaranteed",
            },
            { icon: ThumbsUp, label: "98% Satisfaction", value: "Rate" },
            { icon: Users, label: "5,000+", value: "Happy Customers" },
          ].map((badge, i) => (
            <div key={i} className="text-center">
              <badge.icon className="w-5 h-5 text-neon mx-auto mb-1" />
              <p className="font-heading text-sm font-bold text-foreground">
                {badge.label}
              </p>
              <p className="font-body text-xs text-muted-foreground">
                {badge.value}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Reviews Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {allReviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="bg-card border border-border rounded-lg p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              {review.reviewer_image ? (
                <img
                  src={review.reviewer_image}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-neon/10 flex items-center justify-center font-heading text-sm font-bold text-neon">
                  {review.reviewer_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-body text-sm font-bold text-foreground">
                    {review.reviewer_name}
                  </p>
                  <CheckCircle className="w-3.5 h-3.5 text-neon" />
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-border"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              {review.review_text}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ProductReviews;
