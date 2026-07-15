import { useState } from "react";
import {
  useReviews,
  useAddReview,
  useUpdateReview,
  useDeleteReview,
  type Review,
} from "@/hooks/useReviews";
import { useActiveProducts } from "@/hooks/useDatabase";
import { Plus, Pencil, Trash2, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const emptyForm = {
  reviewer_name: "",
  reviewer_image: "",
  review_text: "",
  rating: 5,
  product_id: "" as string | null,
  show_for_all: false,
  is_active: true,
};

const ReviewsManager = () => {
  const { data: reviews = [], isLoading } = useReviews();
  const { data: products = [] } = useActiveProducts();
  const addReview = useAddReview();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };
  const openEdit = (r: Review) => {
    setEditing(r);
    setForm({
      reviewer_name: r.reviewer_name,
      reviewer_image: r.reviewer_image,
      review_text: r.review_text,
      rating: r.rating,
      product_id: r.product_id,
      show_for_all: r.show_for_all,
      is_active: r.is_active,
    });
    setShowForm(true);
  };
  const close = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.reviewer_name.trim()) {
      toast.error("Reviewer name is required");
      return;
    }
    if (!form.review_text.trim()) {
      toast.error("Review text is required");
      return;
    }
    try {
      const payload = {
        ...form,
        product_id: form.show_for_all ? null : form.product_id || null,
      };
      if (editing) {
        await updateReview.mutateAsync({ id: editing.id, ...payload });
        toast.success("Review updated");
      } else {
        await addReview.mutateAsync(payload);
        toast.success("Review added");
      }
      close();
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await deleteReview.mutateAsync(id);
      toast.success("Deleted");
    } catch {
      toast.error("Failed");
    }
  };

  const toggleActive = async (r: Review) => {
    try {
      await updateReview.mutateAsync({ id: r.id, is_active: !r.is_active });
    } catch {
      toast.error("Failed");
    }
  };

  const getProductName = (pid: string | null) => {
    if (!pid) return "All Products";
    return products.find((p) => p.id === pid)?.name || "Unknown";
  };

  if (isLoading)
    return (
      <p className="text-center py-10 text-muted-foreground font-body">
        Loading...
      </p>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-foreground">
            Reviews
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {reviews.length} reviews
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Add Review
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Reviewer
              </th>
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Product
              </th>
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Rating
              </th>
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                Review
              </th>
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="text-right p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {r.reviewer_image ? (
                      <img
                        src={r.reviewer_image}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-heading text-xs font-bold text-primary">
                        {r.reviewer_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-body text-sm font-semibold text-foreground">
                      {r.reviewer_name}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`font-body text-xs px-2 py-1 rounded-full ${r.show_for_all ? "bg-primary/10 text-primary font-bold" : "bg-muted text-muted-foreground"}`}
                  >
                    {r.show_for_all
                      ? "All Products"
                      : getProductName(r.product_id)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-border"}`}
                      />
                    ))}
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <p className="font-body text-xs text-muted-foreground truncate max-w-[200px]">
                    {r.review_text}
                  </p>
                </td>
                <td className="p-4">
                  <Switch
                    checked={r.is_active}
                    onCheckedChange={() => toggleActive(r)}
                  />
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(r)}
                      className="p-2 hover:bg-secondary rounded-md transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-muted-foreground font-body text-sm"
                >
                  No reviews yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-lg my-8 p-6 md:p-8 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold uppercase tracking-wider text-foreground">
                {editing ? "Edit" : "Add"} Review
              </h2>
              <button
                onClick={close}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">
                  Reviewer Name *
                </label>
                <Input
                  value={form.reviewer_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, reviewer_name: e.target.value }))
                  }
                  placeholder="Ahmed K."
                />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">
                  Reviewer Image URL (optional)
                </label>
                <Input
                  value={form.reviewer_image}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, reviewer_image: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">
                  Star Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, rating: n }))}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${n <= form.rating ? "fill-yellow-400 text-yellow-400" : "text-border hover:text-yellow-300"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">
                  Review Text *
                </label>
                <textarea
                  value={form.review_text}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, review_text: e.target.value }))
                  }
                  placeholder="Write the review..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[100px]"
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.show_for_all}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, show_for_all: v }))
                  }
                />
                <label className="font-body text-sm text-foreground">
                  Show for all products
                </label>
              </div>
              {!form.show_for_all && (
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">
                    Select Product
                  </label>
                  <select
                    value={form.product_id || ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        product_id: e.target.value || null,
                      }))
                    }
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">— Select a product —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, is_active: v }))
                  }
                />
                <label className="font-body text-sm text-foreground">
                  Active
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} className="flex-1">
                  {editing ? "Update" : "Save"}
                </Button>
                <Button variant="outline" onClick={close}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsManager;
