import {
  useAddBanner,
  useBanners,
  useDeleteBanner,
  useUpdateBanner,
  type DbBanner,
} from "@/hooks/useDatabase";
import { deleteProductImage, uploadProductImage } from "@/lib/image-upload";
import {
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const images = [
  "/assets/hero-sports.jpg",
  "/assets/shoe-basketball.jpg",
  "/assets/shoe-runner-1.jpg",
  "/assets/shoe-training.jpg",
  "/assets/shoe-football.jpg",
  "/assets/shoe-trail.jpg",
];

const BannersManager = () => {
  const { data: banners = [], isLoading } = useBanners();
  const addBanner = useAddBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DbBanner | null>(null);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "/parts",
    is_active: true,
    position: "hero" as string,
  });
  const [uploading, setUploading] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);

  const openAdd = () => {
    setEditing(null);
    setForm({
      title: "",
      subtitle: "",
      image_url: "",
      link_url: "/parts",
      is_active: true,
      position: "hero",
    });
    setShowForm(true);
  };
  const openEdit = (b: DbBanner) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle || "",
      image_url: b.image_url,
      link_url: b.link_url || "/parts",
      is_active: b.is_active ?? true,
      position: b.position,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) {
      toast.error("Banner image is required");
      return;
    }
    try {
      if (editing) {
        await updateBanner.mutateAsync({ id: editing.id, ...form });
        toast.success("Banner updated");
      } else {
        await addBanner.mutateAsync(form);
        toast.success("Banner created");
      }
      setShowForm(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file, "banner");
      setForm((f) => ({ ...f, image_url: url }));
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    if (form.image_url) {
      try {
        await deleteProductImage(form.image_url);
      } catch {
        /* ignore */
      }
    }
    setForm((f) => ({ ...f, image_url: "" }));
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
            Banners
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Manage promotional banners
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {banners.map((b) => (
          <div
            key={b.id}
            className="bg-card border border-border overflow-hidden rounded-lg hover:border-primary/20 transition-colors"
          >
            <div className="aspect-video relative">
              <img
                src={b.image_url}
                alt={b.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="inline-block px-2 py-0.5 text-xs font-body font-bold uppercase bg-white/20 text-white mb-2 rounded">
                  {b.position}
                </span>
                <h3 className="font-heading text-xl font-bold uppercase text-white">
                  {b.title}
                </h3>
                <p className="font-body text-sm text-white/80">{b.subtitle}</p>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="font-body text-xs text-muted-foreground">
                Link: {b.link_url}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await updateBanner.mutateAsync({
                      id: b.id,
                      is_active: !b.is_active,
                    });
                  }}
                  className="p-2 hover:bg-secondary rounded-md transition-colors"
                >
                  {b.is_active ? (
                    <Eye className="w-4 h-4 text-primary" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => openEdit(b)}
                  className="p-2 hover:bg-secondary rounded-md transition-colors"
                >
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={async () => {
                    await deleteBanner.mutateAsync(b.id);
                    toast.success("Deleted");
                  }}
                  className="p-2 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-lg my-8 p-6 md:p-8 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground">
                {editing ? "Edit" : "Add"} Banner
              </h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Subtitle
                </label>
                <input
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm({ ...form, subtitle: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Banner Image *
                </label>
                <div className="flex items-start gap-4">
                  {form.image_url ? (
                    <div className="relative w-48 aspect-video rounded-lg overflow-hidden border border-border bg-secondary shrink-0">
                      <img
                        src={form.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-48 aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-secondary/50 shrink-0">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <input
                      ref={imageRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2 border border-border rounded-md font-body text-sm hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {uploading ? "Uploading..." : "Upload Image"}
                    </button>
                    <p className="font-body text-xs text-muted-foreground mt-3 mb-1">
                      Or paste image URL:
                    </p>
                    <input
                      value={form.image_url}
                      onChange={(e) =>
                        setForm({ ...form, image_url: e.target.value })
                      }
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <p className="font-body text-xs text-muted-foreground mt-3">
                  Use a high-quality wide image for best results on all screen
                  sizes
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Link URL
                  </label>
                  <input
                    value={form.link_url}
                    onChange={(e) =>
                      setForm({ ...form, link_url: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Position
                  </label>
                  <select
                    value={form.position}
                    onChange={(e) =>
                      setForm({ ...form, position: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="hero">Hero</option>
                    <option value="promo">Promo</option>
                    <option value="category">Category</option>
                  </select>
                </div>
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
                {editing ? "Save" : "Create"} Banner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannersManager;
