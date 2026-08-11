import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  BadgeCheck,
  Building2,
  Calendar,
  Clock,
  Edit3,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User as UserIcon,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DealerLayout from "./DealerLayout";

interface DealerData {
  id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  area?: string;
  license_number?: string;
  sponsored_details?: string;
  is_approved?: boolean;
  created_at?: string;
  [key: string]: any;
}

const Field = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) => (
  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900 break-words">
        {value || <span className="text-gray-400 italic font-normal">Not provided</span>}
      </p>
    </div>
  </div>
);

const EditInput = ({
  icon: Icon,
  label,
  name,
  value,
  onChange,
  type = "text",
  readOnly = false,
  multiline = false,
}: {
  icon: React.ElementType;
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  readOnly?: boolean;
  multiline?: boolean;
}) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </label>
    {multiline ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        rows={3}
        className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium resize-none transition-colors focus:outline-none ${
          readOnly
            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-white border-gray-200 text-gray-900 focus:border-primary"
        }`}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors focus:outline-none ${
          readOnly
            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-white border-gray-200 text-gray-900 focus:border-primary"
        }`}
      />
    )}
    {readOnly && (
      <p className="text-[10px] text-gray-400 mt-1">This field cannot be edited.</p>
    )}
  </div>
);

export default function DealerProfilePage() {
  const { user } = useAuth();
  const [dealer, setDealer] = useState<DealerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    area: "",
    license_number: "",
    sponsored_details: "",
  });

  useEffect(() => {
    if (!user) return;
    const fetchDealer = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("dealers")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      const resolved: DealerData = data || {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email,
        email: user.email,
        phone: user.user_metadata?.phone,
        area: user.user_metadata?.area,
        license_number: user.user_metadata?.license_number,
        sponsored_details: user.user_metadata?.sponsored_details,
        is_approved: user.user_metadata?.is_approved ?? false,
        created_at: user.created_at,
      };
      setDealer(resolved);
      setForm({
        full_name: resolved.full_name || "",
        phone: resolved.phone || "",
        area: resolved.area || "",
        license_number: resolved.license_number || "",
        sponsored_details: resolved.sponsored_details || "",
      });
      setLoading(false);
    };
    fetchDealer();
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = { id: user.id, email: user.email, ...form };
      const { error } = await supabase
        .from("dealers")
        .upsert(payload, { onConflict: "id" });
      if (error) throw error;
      setDealer((prev) => ({ ...prev, ...form }));
      toast.success("Profile updated successfully!");
      setEditing(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (dealer) {
      setForm({
        full_name: dealer.full_name || "",
        phone: dealer.phone || "",
        area: dealer.area || "",
        license_number: dealer.license_number || "",
        sponsored_details: dealer.sponsored_details || "",
      });
    }
    setEditing(false);
  };

  const initials = (dealer?.full_name || user?.email || "D")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinDate = dealer?.created_at
    ? new Date(dealer.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  if (loading) {
    return (
      <DealerLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DealerLayout>
    );
  }

  return (
    <DealerLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Profile Header Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8 text-white border border-slate-700/50 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary text-3xl font-black shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-white truncate">
                {dealer?.full_name || "Dealer Account"}
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                {dealer?.email || user?.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    dealer?.is_approved
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {dealer?.is_approved ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" /> Approved Partner
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" /> Pending Approval
                    </>
                  )}
                </span>
                {joinDate && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-300 border border-slate-600/50">
                    <Calendar className="w-3 h-3" /> Joined {joinDate}
                  </span>
                )}
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/30 shrink-0"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* View Mode */}
        {!editing && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
                Dealer Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field icon={UserIcon} label="Full Name" value={dealer?.full_name} />
              <Field icon={Mail} label="Email Address" value={dealer?.email || user?.email} />
              <Field icon={Phone} label="Phone Number" value={dealer?.phone} />
              <Field icon={MapPin} label="Area / Region" value={dealer?.area} />
              <Field icon={BadgeCheck} label="License Number" value={dealer?.license_number} />
              <Field
                icon={Building2}
                label="Account Status"
                value={dealer?.is_approved ? "Approved Partner" : "Pending Approval"}
              />
              <div className="sm:col-span-2">
                <Field
                  icon={FileText}
                  label="Sponsored Details / Notes"
                  value={dealer?.sponsored_details}
                />
              </div>
            </div>
          </div>
        )}

        {/* Edit Mode */}
        {editing && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
                  Edit Profile
                </h2>
              </div>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditInput
                  icon={UserIcon}
                  label="Full Name"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                />
                <EditInput
                  icon={Mail}
                  label="Email Address"
                  name="email"
                  value={dealer?.email || user?.email || ""}
                  onChange={handleChange}
                  readOnly
                />
                <EditInput
                  icon={Phone}
                  label="Phone Number"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  type="tel"
                />
                <EditInput
                  icon={MapPin}
                  label="Area / Region"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                />
                <EditInput
                  icon={BadgeCheck}
                  label="License Number"
                  name="license_number"
                  value={form.license_number}
                  onChange={handleChange}
                />
                <EditInput
                  icon={Building2}
                  label="Account Status"
                  name="status"
                  value={dealer?.is_approved ? "Approved Partner" : "Pending Approval"}
                  onChange={() => {}}
                  readOnly
                />
              </div>
              <EditInput
                icon={FileText}
                label="Sponsored Details / Notes"
                name="sponsored_details"
                value={form.sponsored_details}
                onChange={handleChange}
                multiline
              />
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-primary/25"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account & Security */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
              Account &amp; Security
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">User ID</p>
              <p className="text-xs font-mono text-gray-700 mt-0.5 break-all">{user?.id}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Email Verified
              </p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {user?.email_confirmed_at ? (
                  <span className="text-emerald-600">✓ Verified</span>
                ) : (
                  <span className="text-amber-600">⚠ Not Verified</span>
                )}
              </p>
            </div>
            <p className="text-xs text-gray-400 px-1">
              To change your password or email, please contact the administrator.
            </p>
          </div>
        </div>
      </div>
    </DealerLayout>
  );
}
