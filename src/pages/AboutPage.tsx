import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Users,
  Sparkles,
  Download,
  MessageSquare,
  Box,
  Play,
  CheckCircle2,
  ArrowRight,
  Settings,
  Wrench,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const AboutPage = () => {
  const [activeTab, setActiveTab] = useState("quality");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-body overflow-hidden">
      <Navbar />

      <div className="pb-20">
        {/* =========================================
            SECTION 1: HERO (Advanced & Smart)
            ========================================= */}
        <div className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-neon/10 blur-[120px] mix-blend-screen pointer-events-none"></div>
            <div className="absolute bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[100px] mix-blend-screen pointer-events-none"></div>
            <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] opacity-[0.03] pointer-events-none"></div>
          </div>

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
              {/* Left side: Text */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full lg:w-1/2 space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 text-xs font-bold uppercase tracking-widest text-muted-foreground backdrop-blur-md">
                  <Sparkles className="w-4 h-4 text-neon" /> Premium Auto Parts
                </div>

                <h1 className="text-3xl md:text-6xl lg:text-7xl font-heading font-black tracking-tighter leading-[1.1]">
                  Engineered for <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-electric">
                    Excellence.
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                  We bridge the gap between premium performance and everyday
                  accessibility. Experience the ultimate destination for
                  automotive enthusiasts and daily drivers in Oman.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Link
                    to="/parts"
                    className="bg-foreground text-background px-8 py-4 rounded-xl font-bold hover:bg-primary transition-colors shadow-[0_0_20px_rgba(var(--neon),0.3)] hover:shadow-[0_0_30px_rgba(var(--neon),0.5)] flex items-center gap-2"
                  >
                    Explore Catalog <ArrowRight className="w-5 h-5" />
                  </Link>
                  <button className="bg-secondary/50 text-foreground border border-border/50 px-8 py-4 rounded-xl font-bold hover:bg-secondary transition-colors backdrop-blur-sm flex items-center gap-2">
                    <Play className="w-5 h-5" /> Watch Story
                  </button>
                </div>
              </motion.div>

              {/* Right side: Dynamic Image Grid */}
              <div className="w-full lg:w-1/2 relative min-h-[500px]">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="absolute top-0 right-0 w-[70%] h-[70%] rounded-xl overflow-hidden border border-border/50 shadow-2xl z-20"
                >
                  <img
                    src="https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80"
                    alt="Premium Engine"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-md px-4 py-2 rounded-lg border border-border/50">
                    <p className="text-xs font-bold text-neon uppercase tracking-wider">
                      Performance
                    </p>
                    <p className="text-sm font-extrabold">Engine Components</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.4 }}
                  className="absolute bottom-0 left-0 w-[55%] h-[60%] rounded-xl overflow-hidden border border-neon/30 shadow-[0_0_30px_rgba(var(--neon),0.15)] z-30"
                >
                  <img
                    src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80"
                    alt="Brake System"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-md px-4 py-2 rounded-lg border border-border/50">
                    <p className="text-xs font-bold text-hot uppercase tracking-wider">
                      Safety First
                    </p>
                    <p className="text-sm font-extrabold">Premium Brakes</p>
                  </div>
                </motion.div>

                {/* Floating Tech Elements */}
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute top-[20%] -left-[10%] bg-card p-4 rounded-xl shadow-xl border border-border/50 z-40 hidden md:flex items-center gap-3 backdrop-blur-md"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary animate-spin-slow" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">
                      Compatibility
                    </p>
                    <p className="text-sm font-extrabold">100% Guaranteed</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            SECTION 2: STATS
            ========================================= */}
        <div className="container mx-auto px-4 lg:px-8 -mt-8 relative z-30 mb-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                icon: Box,
                count: "50K+",
                label: "Parts Delivered",
                color: "text-blue-500",
              },
              {
                icon: Users,
                count: "10K+",
                label: "Happy Drivers",
                color: "text-green-500",
              },
              {
                icon: Shield,
                count: "100%",
                label: "Genuine Parts",
                color: "text-neon",
              },
              {
                icon: Zap,
                count: "24/7",
                label: "Expert Support",
                color: "text-hot",
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-card/80 backdrop-blur-xl border border-border/50 p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <h3 className="text-3xl font-heading font-black mb-1">
                  {stat.count}
                </h3>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* =========================================
            SECTION 3: OUR STORY (Smart Layout)
            ========================================= */}
        <div className="container mx-auto px-4 lg:px-8 mb-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="rounded-xl overflow-hidden h-[300px] mt-6 shadow-2xl border border-border/30"
                >
                  <img
                    src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80"
                    alt="Sports Car"
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="rounded-xl overflow-hidden h-[300px] shadow-2xl border border-border/30"
                >
                  <img
                    src="https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80"
                    alt="Car Interior"
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  />
                </motion.div>
              </div>

              {/* Decorative Blur */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-neon/5 blur-[100px] -z-10 rounded-full"></div>
            </div>

            <div className="order-1 lg:order-2 space-y-8">
              <div>
                <span className="text-neon font-bold text-sm tracking-widest uppercase mb-2 block">
                  Our Origin
                </span>
                <h2 className="text-4xl md:text-5xl font-heading font-black leading-tight">
                  Driven by{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-neon">
                    Passion.
                  </span>
                  <br />
                  Built for{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-electric">
                    Performance.
                  </span>
                </h2>
              </div>

              <p className="text-muted-foreground text-lg leading-relaxed">
                Oman Auto Parts was born out of a profound passion for
                high-performance vehicles and reliable components. We recognized
                a significant gap in the market for premium, authentic auto
                parts that are easily accessible to both professionals and
                everyday drivers.
              </p>

              <p className="text-muted-foreground text-lg leading-relaxed">
                Today, our meticulously curated catalog spans across essential
                maintenance components, aggressive performance upgrades, and
                high-quality lifestyle accessories, ensuring your vehicle always
                operates at its peak.
              </p>

              <div className="pt-4 flex items-center gap-6 border-t border-border/50">
                <div className="flex -space-x-4">
                  <img
                    src="https://i.pravatar.cc/100?img=11"
                    alt="Team"
                    className="w-14 h-14 rounded-full border-4 border-background object-cover shadow-sm"
                  />
                  <img
                    src="https://i.pravatar.cc/100?img=32"
                    alt="Team"
                    className="w-14 h-14 rounded-full border-4 border-background object-cover shadow-sm"
                  />
                  <img
                    src="https://i.pravatar.cc/100?img=33"
                    alt="Team"
                    className="w-14 h-14 rounded-full border-4 border-background object-cover shadow-sm"
                  />
                  <div className="w-14 h-14 rounded-full border-4 border-background bg-secondary flex items-center justify-center text-sm font-bold shadow-sm">
                    15+
                  </div>
                </div>
                <div>
                  <p className="font-bold text-lg">Expert Team</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Automotive Specialists
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            SECTION 4: CORE VALUES (Interactive)
            ========================================= */}
        <div className="bg-secondary/20 py-10 border-y border-border/50 relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute right-0 top-0 w-1/3 h-full bg-[url('/assets/grid-pattern.svg')] opacity-5 pointer-events-none"></div>

          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-neon font-bold text-sm tracking-widest uppercase mb-2 block">
                Our Standards
              </span>
              <h2 className="text-4xl md:text-5xl font-heading font-black">
                Our Core Values & Legacy
              </h2>
              <p className="mt-6 text-muted-foreground text-lg">
                We operate a seamless e-commerce model focused entirely on
                making your shopping experience smooth, fast, and remarkably
                reliable.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-12 items-center">
              {/* Left: Interactive Tabs */}
              <div className="lg:col-span-5 space-y-4">
                {[
                  {
                    id: "quality",
                    title: "Uncompromised Quality",
                    icon: Shield,
                    desc: "Every single product undergoes rigorous curation to meet the highest industry standards.",
                  },
                  {
                    id: "customer",
                    title: "Customer-Centric",
                    icon: Users,
                    desc: "We redefine auto parts retail by placing your satisfaction and vehicle safety first.",
                  },
                  {
                    id: "durability",
                    title: "Reliable Durability",
                    icon: Wrench,
                    desc: "Products sourced to provide long-lasting performance and undeniable value on the road.",
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-6 rounded-2xl transition-all duration-300 border ${
                      activeTab === tab.id
                        ? "bg-card border-neon shadow-[0_0_20px_rgba(var(--neon),0.15)] scale-[1.02]"
                        : "bg-background/50 border-border/50 hover:bg-card hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl ${activeTab === tab.id ? "bg-neon/10 text-neon" : "bg-secondary text-muted-foreground"}`}
                      >
                        <tab.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3
                          className={`text-xl font-bold ${activeTab === tab.id ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {tab.title}
                        </h3>
                        {activeTab === tab.id && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="text-sm text-muted-foreground mt-2 leading-relaxed"
                          >
                            {tab.desc}
                          </motion.p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Right: Dynamic Visual Display */}
              <div className="lg:col-span-7 relative h-[500px] rounded-[1rem] overflow-hidden bg-card border border-border shadow-2xl flex items-center justify-center p-8">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-luminosity"></div>

                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative z-10 text-center max-w-md bg-background/80 backdrop-blur-2xl p-10 rounded-3xl border border-border/50 shadow-2xl"
                >
                  {activeTab === "quality" && (
                    <>
                      <Shield className="w-16 h-16 mx-auto text-neon mb-6" />
                      <h3 className="text-2xl font-black mb-4">
                        Precision Engineered
                      </h3>
                      <p className="text-muted-foreground">
                        From material selection to the final polish, we do not
                        cut corners. Your vehicle deserves the absolute best.
                      </p>
                    </>
                  )}
                  {activeTab === "customer" && (
                    <>
                      <Users className="w-16 h-16 mx-auto text-primary mb-6" />
                      <h3 className="text-2xl font-black mb-4">
                        Driven By You
                      </h3>
                      <p className="text-muted-foreground">
                        A lightning-fast platform, transparent pricing, and
                        dedicated support to keep you moving forward seamlessly.
                      </p>
                    </>
                  )}
                  {activeTab === "durability" && (
                    <>
                      <Wrench className="w-16 h-16 mx-auto text-hot mb-6" />
                      <h3 className="text-2xl font-black mb-4">
                        Built To Last
                      </h3>
                      <p className="text-muted-foreground">
                        Endurance tested components that withstand extreme
                        conditions, ensuring your peace of mind on every
                        journey.
                      </p>
                    </>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            SECTION 5: CTA
            ========================================= */}
        <div className="container mx-auto px-4 lg:px-8 text-center mt-24 mb-10">
          <div className="bg-gradient-to-b from-card to-background border border-border/50 p-12 md:p-16 rounded-[1rem] relative overflow-hidden shadow-md">
            {/* Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-neon/10 blur-[80px] rounded-full pointer-events-none"></div>

            <h3 className="text-3xl md:text-5xl font-heading font-black mb-6 relative z-10">
              Ready to Upgrade?
            </h3>
            <p className="text-xl text-muted-foreground leading-relaxed mb-10 relative z-10 mx-auto">
              Whether you are repairing your daily driver or building a track
              monster, we have the parts to accompany you on that journey.
            </p>
            <Link
              to="/parts"
              className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-xl font-bold tracking-widest uppercase hover:bg-primary hover:text-primary-foreground transition-all shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_10px_40px_rgba(var(--primary),0.4)] hover:-translate-y-1 relative z-10"
            >
              Shop Parts Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutPage;
