import { useState } from "react";
import {
  useCoupons,
  useAddCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
  type DbCoupon,
} from "@/hooks/useDatabase";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import DirhamIcon from "@/components/DirhamIcon";

const CouponsManager = () => {
  const { data: coupons = [], isLoading } = useCoupons();
  const addCoupon = useAddCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DbCoupon | null>(null);
  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: 10,
    min_order: 0,
    max_uses: 100,
    is_active: true,
    expires_at: "2026-12-31",
  });

  const openAdd = () => {
    setEditing(null);
    setForm({
      code: "",
      type: "percentage",
      value: 10,
      min_order: 0,
      max_uses: 100,
      is_active: true,
      expires_at: "2026-12-31",
    });
    setShowForm(true);
  };
  const openEdit = (c: DbCoupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      value: Number(c.value),
      min_order: Number(c.min_order) || 0,
      max_uses: c.max_uses || 100,
      is_active: c.is_active ?? true,
      expires_at: c.expires_at,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateCoupon.mutateAsync({ id: editing.id, ...form });
        toast.success("Coupon updated");
      } else {
        await addCoupon.mutateAsync(form);
        toast.success("Coupon created");
      }
      setShowForm(false);
    } catch {
      toast.error("Failed to save coupon");
    }
  };

  if (isLoading)
    return (
      <p className="text-center py-10 text-muted-foreground">Loading...</p>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-foreground">
            Coupons
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {coupons.length} coupons
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="bg-card border border-border p-6 rounded-lg hover:border-primary/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-heading text-xl font-bold uppercase tracking-wider text-primary">
                {c.code}
              </span>
              <span
                className={`px-2 py-1 text-xs font-body font-bold rounded-full uppercase ${c.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {c.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="font-body text-2xl font-bold mb-1 text-foreground">
              {c.type === "percentage" ? (
                `${Number(c.value)}% OFF`
              ) : (
                <span className="flex items-center gap-1">
                  <DirhamIcon /> {Number(c.value)} OFF
                </span>
              )}
            </p>
            <p className="font-body text-xs text-muted-foreground mb-3 flex items-center gap-1">
              Min order: <DirhamIcon className="w-3 h-3" />{" "}
              {Number(c.min_order)}
            </p>
            <div className="flex justify-between font-body text-xs text-muted-foreground mb-4">
              <span>
                Used: {c.used_count}/{c.max_uses}
              </span>
              <span>Expires: {c.expires_at}</span>
            </div>
            <div className="w-full bg-secondary h-1.5 rounded-full mb-4">
              <div
                className="bg-primary h-1.5 rounded-full"
                style={{
                  width: `${((c.used_count || 0) / (c.max_uses || 1)) * 100}%`,
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(c)}
                className="flex-1 py-2 border border-border rounded-md font-body text-xs uppercase tracking-wider hover:border-primary/50 transition-colors text-foreground"
              >
                <Pencil className="w-3 h-3 inline mr-1" /> Edit
              </button>
              <button
                onClick={async () => {
                  await deleteCoupon.mutateAsync(c.id);
                  toast.success("Deleted");
                }}
                className="py-2 px-3 border border-border rounded-md hover:border-red-300 text-red-500 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md p-8 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground">
                {editing ? "Edit" : "Add"} Coupon
              </h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Code
                </label>
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Value
                  </label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) =>
                      setForm({ ...form, value: +e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                    Min Order (<DirhamIcon className="w-3 h-3" />)
                  </label>
                  <input
                    type="number"
                    value={form.min_order}
                    onChange={(e) =>
                      setForm({ ...form, min_order: +e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Max Uses
                  </label>
                  <input
                    type="number"
                    value={form.max_uses}
                    onChange={(e) =>
                      setForm({ ...form, max_uses: +e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Expires
                </label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) =>
                    setForm({ ...form, expires_at: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <label className="flex items-center gap-2 font-body text-sm cursor-pointer text-foreground">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="accent-primary"
                />{" "}
                Active
              </label>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3 rounded-md font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all"
              >
                {editing ? "Save" : "Create"} Coupon
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponsManager;
