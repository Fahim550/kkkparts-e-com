import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  useAddCategory,
  useCategories,
  useDeleteCategory,
  useUpdateCategory,
  type DbCategory,
} from "@/hooks/useCategories";
import { deleteProductImage, uploadProductImage } from "@/lib/image-upload";
import {
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const emptyForm = {
  name: "",
  slug: "",
  parent_id: "" as string,
  description: "",
  image_url: "",
  is_active: true,
  sort_order: 0,
};

const CategoriesManager = () => {
  const { data: categories = [], isLoading } = useCategories();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DbCategory | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const imageRef = useRef<HTMLInputElement>(null);

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const getParentName = (parentId: string | null) => {
    if (!parentId) return "—";
    const parent = categories.find((c) => c.id === parentId);
    return parent ? parent.name : "—";
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (cat: DbCategory) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id || "",
      description: cat.description || "",
      image_url: cat.image_url || "",
      is_active: cat.is_active ?? true,
      sort_order: cat.sort_order ?? 0,
    });
    setShowForm(true);
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: editing ? f.slug : generateSlug(name),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file, "category");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      toast.error("Name and slug are required");
      return;
    }

    const data: any = {
      name: form.name,
      slug: form.slug,
      parent_id: form.parent_id || null,
      description: form.description,
      image_url: form.image_url,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };

    try {
      if (editing) {
        await updateCategory.mutateAsync({ id: editing.id, ...data });
        toast.success("Category updated");
      } else {
        await addCategory.mutateAsync(data);
        toast.success("Category added");
      }
      setShowForm(false);
    } catch {
      toast.error("Failed to save category");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const children = categories.filter((c) => c.parent_id === id);
    if (children.length > 0) {
      toast.error(
        `Cannot delete "${name}" — it has ${children.length} subcategories`,
      );
      return;
    }
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await deleteCategory.mutateAsync(id);
      toast.success(`"${name}" deleted`);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggleActive = async (cat: DbCategory) => {
    try {
      await updateCategory.mutateAsync({
        id: cat.id,
        is_active: !cat.is_active,
      });
      toast.success(`${cat.name} ${cat.is_active ? "disabled" : "enabled"}`);
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-foreground">
            Categories
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {categories.length} total categories
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-11 pr-4 py-3 border border-border bg-card rounded-md font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {isLoading ? (
        <p className="text-center py-10 text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="bg-card border border-border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                    Image
                  </th>
                  <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                    Slug
                  </th>
                  <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                    Parent
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
                {paginated.map((cat) => (
                  <tr
                    key={cat.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                  >
                    <td className="p-4">
                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          className="w-10 h-10 object-cover rounded bg-secondary"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-body text-sm font-semibold text-foreground">
                        {cat.name}
                      </p>
                      {cat.description && (
                        <p className="font-body text-xs text-muted-foreground truncate max-w-[200px]">
                          {cat.description}
                        </p>
                      )}
                    </td>
                    <td className="p-4 font-body text-sm text-muted-foreground hidden md:table-cell">
                      {cat.slug}
                    </td>
                    <td className="p-4 font-body text-sm text-muted-foreground hidden md:table-cell">
                      {getParentName(cat.parent_id)}
                    </td>
                    <td className="p-4">
                      <Switch
                        checked={cat.is_active ?? true}
                        onCheckedChange={() => handleToggleActive(cat)}
                      />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-2 hover:bg-secondary rounded-md transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-muted-foreground font-body text-sm"
                    >
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="font-body text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-xl my-8 p-6 md:p-8 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground">
                {editing ? "Edit" : "Add"} Category
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Category Name *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  placeholder="e.g. Running"
                />
              </div>
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Slug *
                </label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                  placeholder="e.g. running"
                />
              </div>
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Parent Category
                </label>
                <select
                  value={form.parent_id}
                  onChange={(e) =>
                    setForm({ ...form, parent_id: e.target.value })
                  }
                  className="w-full h-10 px-3 border border-input bg-background rounded-md font-body text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">None (Top Level)</option>
                  {categories
                    .filter((c) => c.id !== editing?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Category description..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Category Image
                </label>
                <div className="flex items-start gap-4">
                  {form.image_url ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border bg-secondary">
                      <img
                        src={form.image_url}
                        alt="Category"
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
                    <button
                      type="button"
                      onClick={() => imageRef.current?.click()}
                      className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center bg-secondary/50 hover:border-primary transition-colors"
                    >
                      {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">
                            Upload
                          </span>
                        </>
                      )}
                    </button>
                  )}
                  <input
                    ref={imageRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Sort Order
                  </label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm({ ...form, sort_order: +e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, is_active: checked })
                    }
                  />
                  <span className="font-body text-sm text-foreground">
                    {form.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1 font-body font-bold tracking-wider uppercase"
                >
                  {editing ? "Update" : "Save"} Category
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="font-body tracking-wider uppercase"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManager;
