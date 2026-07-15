import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  User as UserIcon,
  Phone,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const DealerLoginPage = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(
    !location.pathname.includes("register"),
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sponsoredDetails, setSponsoredDetails] = useState("");
  const [area, setArea] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setIsLogin(!location.pathname.includes("register"));
  }, [location.pathname]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let authEmail = email.trim();

      if (isLogin) {
        if (authEmail && !authEmail.includes("@")) {
          authEmail = `${authEmail}@dealer.local`;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });

        if (error) throw error;

        // Check if user is an admin - if so, redirect to admin
        const { data: adminRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (adminRole) {
          navigate("/admin");
          return;
        }

        const { data: profile } = await supabase
          .from("dealers")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profile && !profile.is_approved) {
          toast.info(
            "Your dealer account is pending approval by an admin. You will not see wholesale prices until approved.",
          );
        } else {
          toast.success("Dealer login successful");
        }

        const from = (location.state as any)?.from || "/dealer/dashboard";
        navigate(from);
      } else {
        if (!phone.trim()) {
          toast.error("Phone number is required for registration");
          setLoading(false);
          return;
        }

        if (!authEmail) {
          authEmail = `${phone.trim()}@dealer.local`;
        }

        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password,
          options: {
            data: {
              full_name: name,
              phone: phone,
              role: "dealer",
              sponsored_details: sponsoredDetails,
              area: area,
              license_number: licenseNumber,
              is_approved: false,
              plain_password: password,
            },
          },
        });

        if (error) throw error;

        toast.success("Registration successful! Welcome to the dealer portal.");
        navigate("/dealer/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="flex-grow flex flex-col lg:flex-row mt-[74px] min-h-[calc(100vh-74px)] relative bg-gray-50 lg:bg-white overflow-hidden">
        {/* Mobile Header Image */}
        <div className="lg:hidden w-full h-[30vh] min-h-[250px] relative shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 z-10" />

          <img
            src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=60"
            alt="Login Background"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${isLogin ? "opacity-100" : "opacity-0 scale-105"}`}
          />
          <img
            src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=60"
            alt="Register Background"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${!isLogin ? "opacity-100" : "opacity-0 scale-105"}`}
          />

          <div className="absolute bottom-10 left-0 w-full px-8 z-20 text-white">
            <h3 className="font-heading text-2xl font-extrabold uppercase tracking-widest mb-2 shadow-black drop-shadow-lg leading-tight transition-all duration-500">
              {isLogin ? (
                <>
                  Genuine Parts.
                  <br />
                  <span className="text-primary">Wholesale Prices.</span>
                </>
              ) : (
                <>
                  Join Network.
                  <br />
                  <span className="text-primary">Grow Business.</span>
                </>
              )}
            </h3>
          </div>
        </div>

        {/* Form Container (Left on Desktop, Bottom Sheet on Mobile) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 xl:p-24 bg-white relative z-20 -mt-8 lg:mt-0 rounded-t-[2.5rem] lg:rounded-none shadow-[0_-15px_40px_rgba(0,0,0,0.1)] lg:shadow-none flex-grow">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Sheet Handle */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 lg:hidden"></div>

            <div className="text-center lg:text-left">
              <div className="flex justify-center lg:justify-start mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/20 shadow-sm">
                  <ShieldCheck className="w-8 h-8 text-primary drop-shadow-sm" />
                </div>
              </div>
              <h2 className="mt-2 text-3xl font-heading font-extrabold uppercase tracking-widest text-gray-900">
                {isLogin ? "Dealer Login" : "Apply Now"}
              </h2>
              <p className="mt-2 text-sm text-gray-500 font-body">
                {isLogin
                  ? "Welcome back! Access your wholesale portal"
                  : "Register to unlock exclusive wholesale pricing"}
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="flex p-1.5 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  navigate("/dealer/login");
                }}
                className={`flex-1 py-3.5 text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${
                  isLogin
                    ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  navigate("/dealer/register");
                }}
                className={`flex-1 py-3.5 text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${
                  !isLogin
                    ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Register
              </button>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleAuth}>
              {!isLogin && (
                <>
                  <div>
                    <label className="sr-only">Full Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="text"
                        required
                        className="text-left appearance-none rounded-xl relative block w-full px-4 py-4 pl-12 border border-gray-200 bg-gray-50 lg:bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all shadow-sm"
                        placeholder="Company Name / Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="sr-only">Phone Number</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="tel"
                        required
                        className="text-left appearance-none rounded-xl relative block w-full px-4 py-4 pl-12 border border-gray-200 bg-gray-50 lg:bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all shadow-sm"
                        placeholder="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="sr-only">License Number</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <ShieldCheck className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="text"
                        required
                        className="text-left appearance-none rounded-xl relative block w-full px-4 py-4 pl-12 border border-gray-200 bg-gray-50 lg:bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all shadow-sm"
                        placeholder="License Number"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="sr-only">Dealer Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="text"
                        className="text-left appearance-none rounded-xl relative block w-full px-4 py-4 pl-12 border border-gray-200 bg-gray-50 lg:bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all shadow-sm"
                        placeholder="Dealer Address"
                        value={sponsoredDetails}
                        onChange={(e) => setSponsoredDetails(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="sr-only">Dealer Area</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="text"
                        className="text-left appearance-none rounded-xl relative block w-full px-4 py-4 pl-12 border border-gray-200 bg-gray-50 lg:bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all shadow-sm"
                        placeholder="Dealer Area"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="sr-only">
                  {isLogin
                    ? "Email or Phone Number"
                    : "Email address (Optional)"}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    required={isLogin}
                    className="text-left appearance-none rounded-xl relative block w-full px-4 py-4 pl-12 border border-gray-200 bg-gray-50 lg:bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all shadow-sm"
                    placeholder={
                      isLogin
                        ? "Email or Phone Number"
                        : "Email address (Optional)"
                    }
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="sr-only">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={isLogin ? 1 : 6}
                    className="text-left appearance-none rounded-xl relative block w-full px-4 py-4 pl-12 border border-gray-200 bg-gray-50 lg:bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all shadow-sm"
                    placeholder={
                      isLogin ? "Password" : "Password (min 6 chars)"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold uppercase tracking-widest rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-primary disabled:opacity-50 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] overflow-hidden"
                >
                  {loading
                    ? "Processing..."
                    : isLogin
                      ? "Sign in"
                      : "Create Account"}
                  <span className="absolute right-0 inset-y-0 flex items-center pr-4">
                    <ArrowRight
                      className="h-5 w-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all"
                      aria-hidden="true"
                    />
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Desktop Right Side Image Cover */}
        <div className="hidden lg:block lg:w-1/2 relative bg-black overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />

          <img
            src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=60"
            alt="Login Background"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${isLogin ? "opacity-90 scale-100" : "opacity-0 scale-105"}`}
          />
          <img
            src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=60"
            alt="Register Background"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${!isLogin ? "opacity-90 scale-100" : "opacity-0 scale-105"}`}
          />

          <div className="absolute bottom-0 left-0 w-full p-16 z-20 text-white transition-all duration-500">
            <h3 className="font-heading text-4xl font-extrabold uppercase tracking-widest mb-4 leading-tight">
              {isLogin ? (
                <>
                  Genuine Parts.
                  <br />
                  <span className="text-primary">Wholesale Prices.</span>
                </>
              ) : (
                <>
                  Join Our Network.
                  <br />
                  <span className="text-primary">Grow Your Business.</span>
                </>
              )}
            </h3>
            <p className="font-body text-gray-300 text-lg max-w-md">
              {isLogin
                ? "Sign in to access your dashboard, view real-time inventory, and track your wholesale orders instantly."
                : "Join Oman's largest network of verified car parts dealers and enjoy exclusive benefits, bulk discounts, and priority support."}
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DealerLoginPage;
