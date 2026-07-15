import { useState } from "react";
import {
  useShippingMethods,
  useAddShippingMethod,
  useUpdateShippingMethod,
  useDeleteShippingMethod,
  type ShippingMethod,
} from "@/hooks/useShippingMethods";
import { Plus, Pencil, Trash2, X, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import DirhamIcon from "@/components/DirhamIcon";

const emptyForm = {
  name: "",
  area_zone: "",
  charge: 0,
  estimated_delivery: "",
  description: "",
  is_active: true,
  sort_order: 0,
};

const ShippingMethodsManager = () => {
  const { data: methods = [], isLoading } = useShippingMethods();
  const addMethod = useAddShippingMethod();
  const updateMethod = useUpdateShippingMethod();
  const deleteMethod = useDeleteShippingMethod();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ShippingMethod | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };
  const openEdit = (m: ShippingMethod) => {
    setEditing(m);
    setForm({
      name: m.name,
      area_zone: m.area_zone,
      charge: m.charge,
      estimated_delivery: m.estimated_delivery,
      description: m.description,
      is_active: m.is_active,
      sort_order: m.sort_order,
    });
    setShowForm(true);
  };
  const close = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      if (editing) {
        await updateMethod.mutateAsync({ id: editing.id, ...form });
        toast.success("Shipping method updated");
      } else {
        await addMethod.mutateAsync(form);
        toast.success("Shipping method added");
      }
      close();
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this shipping method?")) return;
    try {
      await deleteMethod.mutateAsync(id);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleActive = async (m: ShippingMethod) => {
    try {
      await updateMethod.mutateAsync({ id: m.id, is_active: !m.is_active });
    } catch {
      toast.error("Failed to update");
    }
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
            Shipping Methods
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {methods.length} methods configured
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Add Method
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Name
              </th>
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Area / Zone
              </th>
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Charge
              </th>
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                Delivery Time
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
            {methods.map((m) => (
              <tr
                key={m.id}
                className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="font-body text-sm font-semibold text-foreground">
                        {m.name}
                      </p>
                      {m.description && (
                        <p className="font-body text-xs text-muted-foreground">
                          {m.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 font-body text-sm text-foreground">
                  {m.area_zone || "—"}
                </td>
                <td className="p-4 font-body text-sm font-bold text-primary">
                  {m.charge === 0 ? (
                    "Free"
                  ) : (
                    <span className="flex items-center gap-1">
                      <DirhamIcon /> {Number(m.charge).toFixed(3)}
                    </span>
                  )}
                </td>
                <td className="p-4 font-body text-xs text-muted-foreground hidden md:table-cell">
                  {m.estimated_delivery || "—"}
                </td>
                <td className="p-4">
                  <Switch
                    checked={m.is_active}
                    onCheckedChange={() => toggleActive(m)}
                  />
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(m)}
                      className="p-2 hover:bg-secondary rounded-md transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {methods.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-muted-foreground font-body text-sm"
                >
                  No shipping methods yet
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
                {editing ? "Edit" : "Add"} Shipping Method
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
                  Method Name *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Standard Delivery"
                />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">
                  Area / Zone
                </label>
                <Input
                  value={form.area_zone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, area_zone: e.target.value }))
                  }
                  placeholder="All Dubai"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                    Charge (<DirhamIcon className="w-3 h-3" />)
                  </label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={form.charge}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, charge: Number(e.target.value) }))
                    }
                  />
                </div>
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">
                    Sort Order
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        sort_order: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">
                  Estimated Delivery
                </label>
                <Input
                  value={form.estimated_delivery}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      estimated_delivery: e.target.value,
                    }))
                  }
                  placeholder="2-4 days"
                />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Description..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
                />
              </div>
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

export default ShippingMethodsManager;
