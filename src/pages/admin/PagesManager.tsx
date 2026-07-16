import {
  useAllPageContents,
  useDeletePageContent,
  useUpsertPageContent,
  type PageContent,
} from "@/hooks/usePageContents";
import { Eye, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PagesManager = () => {
  const { data: pages = [], isLoading } = useAllPageContents();
  const upsertPage = useUpsertPageContent();
  const deletePage = useDeletePageContent();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PageContent | null>(null);
  const [form, setForm] = useState({
    page_slug: "",
    page_title: "",
    content: "",
    meta_title: "",
    meta_description: "",
    is_active: true,
  });

  const openAdd = () => {
    setEditing(null);
    setForm({
      page_slug: "",
      page_title: "",
      content: "",
      meta_title: "",
      meta_description: "",
      is_active: true,
    });
    setShowForm(true);
  };

  const openEdit = (p: PageContent) => {
    setEditing(p);
    setForm({
      page_slug: p.page_slug,
      page_title: p.page_title,
      content: p.content,
      meta_title: p.meta_title || "",
      meta_description: p.meta_description || "",
      is_active: p.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertPage.mutateAsync(form);
      toast.success(editing ? "Page updated" : "Page created");
      setShowForm(false);
    } catch {
      toast.error("Failed to save");
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
            Pages
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Manage About Us, Contact Us & other pages
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Page
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left px-6 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">
                Page
              </th>
              <th className="text-left px-6 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">
                Slug
              </th>
              <th className="text-left px-6 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="text-right px-6 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pages.map((p) => (
              <tr key={p.id} className="hover:bg-secondary/20">
                <td className="px-6 py-4 font-body text-sm font-medium text-foreground">
                  {p.page_title}
                </td>
                <td className="px-6 py-4 font-body text-sm text-muted-foreground">
                  /{p.page_slug}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-body font-medium ${p.is_active ? "bg-green-100 text-green-800" : "bg-secondary text-muted-foreground"}`}
                  >
                    {p.is_active ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                    {p.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-2 hover:bg-secondary rounded-md transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={async () => {
                        await deletePage.mutateAsync(p.id);
                        toast.success("Deleted");
                      }}
                      className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-2xl my-8 p-6 md:p-8 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground">
                {editing ? "Edit" : "Add"} Page
              </h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Page Title
                  </label>
                  <input
                    value={form.page_title}
                    onChange={(e) =>
                      setForm({ ...form, page_title: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    URL Slug
                  </label>
                  <input
                    value={form.page_slug}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        page_slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    required
                    disabled={!!editing}
                    className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                  />
                </div>
              </div>
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Content
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  rows={10}
                  className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary resize-none"
                />
                <p className="font-body text-xs text-muted-foreground mt-1">
                  Use new lines to create paragraphs
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Meta Title
                  </label>
                  <input
                    value={form.meta_title}
                    onChange={(e) =>
                      setForm({ ...form, meta_title: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Meta Description
                  </label>
                  <input
                    value={form.meta_description}
                    onChange={(e) =>
                      setForm({ ...form, meta_description: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                  />
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
                disabled={upsertPage.isPending}
                className="w-full bg-primary text-primary-foreground py-3 rounded-md font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {upsertPage.isPending
                  ? "Saving..."
                  : editing
                    ? "Update Page"
                    : "Create Page"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagesManager;
