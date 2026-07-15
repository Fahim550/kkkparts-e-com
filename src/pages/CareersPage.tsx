import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Send, CheckCircle, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadProductImage } from "@/lib/image-upload";
import { Link } from "react-router-dom";

const CareersPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "General Application",
    coverLetter: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCvFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      let cvUrl = null;
      if (cvFile) {
        // Upload CV to existing product-images bucket under cv_uploads folder
        cvUrl = await uploadProductImage(cvFile, "cv_uploads");
      }

      const { error } = await supabase.from("job_applications").insert([
        {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          cover_letter: formData.coverLetter,
          cv_url: cvUrl,
        },
      ]);

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Application submitted successfully!");
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(
        error.message || "Failed to submit application. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-xl p-10 text-center max-w-md mx-4 shadow-xl shadow-neon/5"
        >
          <div className="w-20 h-20 bg-neon/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-neon" />
          </div>
          <h2 className="text-3xl font-heading font-bold mb-4 text-foreground uppercase">
            Application Received!
          </h2>
          <p className="text-muted-foreground font-body mb-8">
            Thank you for applying. Our HR team will review your CV and get back
            to you if your profile matches our requirements.
          </p>
          <Link
            to="/"
            onClick={() => {
              setIsSuccess(false);
              setFormData({
                fullName: "",
                email: "",
                phone: "",
                position: "General Application",
                coverLetter: "",
              });
              setCvFile(null);
            }}
            className="flex items-center justify-center w-full bg-neon text-white hover:bg-neon-glow px-6 py-4 rounded-xl font-bold uppercase tracking-wider transition-all shadow-md mt-4"
          >
            Back to Homepage
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center p-4 bg-neon/10 rounded-full mb-6 ring-1 ring-neon/30">
            <Briefcase className="w-10 h-10 text-neon" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-foreground uppercase tracking-tight">
            Join Our Team
          </h1>
          <p className="text-lg text-muted-foreground font-body max-w-xl mx-auto">
            Take the next step in your career. Fill out the form below and
            attach your CV to apply for open positions.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border border-border/50 rounded-xl p-6 md:p-8 shadow-2xl shadow-neon/5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon via-primary to-neon"></div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold tracking-wider uppercase text-foreground/80 flex items-center gap-2">
                  Full Name <span className="text-neon">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-sm px-4 py-3 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold tracking-wider uppercase text-foreground/80 flex items-center gap-2">
                  Email Address <span className="text-neon">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-sm px-4 py-3 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold tracking-wider uppercase text-foreground/80 flex items-center gap-2">
                  Phone Number <span className="text-neon">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-sm px-4 py-3 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                  placeholder="+971 50 123 4567"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold tracking-wider uppercase text-foreground/80">
                  Position Applied For
                </label>
                <select
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-sm px-4 py-3 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all appearance-none"
                >
                  <option value="General Application">
                    General Application
                  </option>
                  <option value="Customer Support Executive">
                    Customer Support Executive
                  </option>
                  <option value="Delivery Personnel">Delivery Personnel</option>
                  <option value="Digital Marketer">Digital Marketer</option>
                  <option value="Sales Representative">
                    Sales Representative
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold tracking-wider uppercase text-foreground/80">
                Cover Letter / Message
              </label>
              <textarea
                value={formData.coverLetter}
                onChange={(e) =>
                  setFormData({ ...formData, coverLetter: e.target.value })
                }
                rows={4}
                className="w-full bg-background border border-border rounded-sm px-4 py-3 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all resize-none"
                placeholder="Tell us why you'd be a great fit for our team..."
              ></textarea>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-bold tracking-wider uppercase text-foreground/80 flex items-center gap-2">
                Upload CV (PDF, DOCX)
              </label>
              <div className="relative border-2 border-dashed border-border hover:border-neon/50 bg-background/50 rounded-lg p-8 transition-colors text-center group cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-3">
                  {cvFile ? (
                    <>
                      <div className="w-12 h-12 bg-neon/10 rounded-full flex items-center justify-center text-neon">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-foreground">
                        {cvFile.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center group-hover:bg-neon/10 group-hover:text-neon transition-colors text-muted-foreground">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                        Click or drag file to this area to upload
                      </div>
                      <div className="text-xs text-muted-foreground/70">
                        Supports PDF, DOC, DOCX up to 5MB
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border/50">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-neon text-accent-foreground glow-neon hover:bg-neon-glow px-10 py-4 rounded-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CareersPage;
