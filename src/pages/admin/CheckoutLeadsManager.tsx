import { useState, useMemo } from "react";
import {
  useCheckoutLeads,
  useUpdateCheckoutLead,
  useDeleteCheckoutLead,
  type CheckoutLead,
} from "@/hooks/useCheckoutLeads";
import {
  Search,
  Trash2,
  Eye,
  Phone,
  CheckCircle,
  UserCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending_checkout: "bg-yellow-100 text-yellow-700",
  abandoned: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
};

const statusLabels: Record<string, string> = {
  pending_checkout: "Pending Checkout",
  abandoned: "Abandoned",
  completed: "Completed Order",
};

const statusFilters = ["all", "pending_checkout", "abandoned", "completed"];

const CheckoutLeadsManager = () => {
  const { data: leads = [], isLoading } = useCheckoutLeads();
  const updateLead = useUpdateCheckoutLead();
  const deleteLead = useDeleteCheckoutLead();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingLead, setViewingLead] = useState<CheckoutLead | null>(null);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.customer_phone.toLowerCase().includes(q) ||
          l.customer_name.toLowerCase().includes(q) ||
          l.customer_email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leads, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length };
    statusFilters.slice(1).forEach((s) => {
      counts[s] = leads.filter((l) => l.status === s).length;
    });
    return counts;
  }, [leads]);

  const handleMarkContacted = async (lead: CheckoutLead) => {
    try {
      await updateLead.mutateAsync({ id: lead.id, contacted: !lead.contacted });
      toast.success(
        lead.contacted ? "Unmarked as contacted" : "Marked as contacted",
      );
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleMarkAbandoned = async (id: string) => {
    try {
      await updateLead.mutateAsync({ id, status: "abandoned" });
      toast.success("Marked as abandoned");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleMarkConverted = async (id: string) => {
    try {
      await updateLead.mutateAsync({ id, status: "completed" });
      toast.success("Marked as converted");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this lead?")) return;
    try {
      await deleteLead.mutateAsync(id);
      toast.success("Lead deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (isLoading)
    return (
      <p className="text-center py-10 text-muted-foreground">Loading...</p>
    );

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-foreground">
          Checkout Leads
        </h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          {leads.length} total leads · {statusCounts.abandoned || 0} abandoned
        </p>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-md font-body text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            }`}
          >
            {s === "all" ? "All" : statusLabels[s] || s}
            <span className="ml-1.5 text-xs opacity-70">
              ({statusCounts[s] || 0})
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by phone, name, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-border bg-card rounded-md font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Customer
              </th>
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Phone
              </th>
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                Products
              </th>
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Total
              </th>
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                Updated
              </th>
              <th className="text-right p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => {
              const items = (lead.cart_items as any[]) || [];
              return (
                <tr
                  key={lead.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <p className="font-body text-sm font-semibold text-foreground">
                        {lead.customer_name || "—"}
                      </p>
                      {lead.contacted && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      )}
                    </div>
                    {lead.customer_email && (
                      <p className="font-body text-xs text-muted-foreground">
                        {lead.customer_email}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <a
                      href={`tel:${lead.customer_phone}`}
                      className="font-body text-sm text-primary hover:underline"
                    >
                      {lead.customer_phone}
                    </a>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <p className="font-body text-xs text-muted-foreground truncate max-w-[200px]">
                      {items.length > 0
                        ? items
                            .map((i: any) => i.productName || i.name)
                            .join(", ")
                        : "—"}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="font-body text-sm font-bold text-foreground">
                      OMR {Number(lead.cart_total).toFixed(3)}
                    </p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 text-xs font-body font-bold rounded-full uppercase ${statusColors[lead.status] || "bg-muted text-muted-foreground"}`}
                    >
                      {statusLabels[lead.status] || lead.status}
                    </span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <p className="font-body text-xs text-muted-foreground">
                      {timeAgo(lead.updated_at)}
                    </p>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewingLead(lead)}
                        className="p-2 hover:bg-secondary rounded-md transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleMarkContacted(lead)}
                        className="p-2 hover:bg-secondary rounded-md transition-colors"
                        title={
                          lead.contacted ? "Unmark contacted" : "Mark contacted"
                        }
                      >
                        <Phone
                          className={`w-4 h-4 ${lead.contacted ? "text-green-500" : "text-muted-foreground"}`}
                        />
                      </button>
                      {lead.status !== "completed" && (
                        <button
                          onClick={() => handleMarkConverted(lead.id)}
                          className="p-2 hover:bg-secondary rounded-md transition-colors"
                          title="Mark as converted"
                        >
                          <UserCheck className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-muted-foreground font-body text-sm"
                >
                  No leads found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Lead Detail Modal */}
      {viewingLead && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-lg my-8 p-6 md:p-8 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold uppercase tracking-wider text-foreground">
                Lead Details
              </h2>
              <button
                onClick={() => setViewingLead(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 text-xs font-body font-bold rounded-full uppercase ${statusColors[viewingLead.status] || ""}`}
                >
                  {statusLabels[viewingLead.status] || viewingLead.status}
                </span>
                {viewingLead.contacted && (
                  <span className="text-xs font-body text-green-600 font-semibold">
                    ✓ Contacted
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Name
                  </p>
                  <p className="font-body text-sm font-semibold text-foreground">
                    {viewingLead.customer_name || "—"}
                  </p>
                </div>
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Phone
                  </p>
                  <a
                    href={`tel:${viewingLead.customer_phone}`}
                    className="font-body text-sm text-primary font-semibold hover:underline"
                  >
                    {viewingLead.customer_phone}
                  </a>
                </div>
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Email
                  </p>
                  <p className="font-body text-sm text-foreground">
                    {viewingLead.customer_email || "—"}
                  </p>
                </div>
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Area
                  </p>
                  <p className="font-body text-sm text-foreground">
                    {viewingLead.area || "—"}
                  </p>
                </div>
              </div>

              {viewingLead.shipping_address && (
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Address
                  </p>
                  <p className="font-body text-sm text-foreground">
                    {viewingLead.shipping_address}
                  </p>
                </div>
              )}

              {viewingLead.notes && (
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Notes
                  </p>
                  <p className="font-body text-sm text-foreground">
                    {viewingLead.notes}
                  </p>
                </div>
              )}

              <div>
                <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Cart Items
                </p>
                {((viewingLead.cart_items as any[]) || []).length > 0 ? (
                  <div className="space-y-2">
                    {((viewingLead.cart_items as any[]) || []).map(
                      (item: any, i: number) => (
                        <div
                          key={i}
                          className="flex justify-between font-body text-sm py-1.5 border-b border-border last:border-0"
                        >
                          <span className="text-foreground">
                            {item.productName || item.name}{" "}
                            {item.size ? `(Size ${item.size})` : ""}{" "}
                            {item.color ? `· ${item.color}` : ""} ×
                            {item.quantity}
                          </span>
                          <span className="font-semibold text-foreground">
                            OMR{" "}
                            {((item.price || 0) * (item.quantity || 1)).toFixed(
                              3,
                            )}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="font-body text-sm text-muted-foreground">
                    No items
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center border-t border-border pt-4">
                <span className="font-heading text-lg font-bold text-foreground">
                  Total
                </span>
                <span className="font-heading text-lg font-bold text-primary">
                  OMR {Number(viewingLead.cart_total).toFixed(3)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-body text-muted-foreground">
                <div>
                  Created:{" "}
                  {new Date(viewingLead.created_at).toLocaleString("en-GB")}
                </div>
                <div>
                  Updated:{" "}
                  {new Date(viewingLead.updated_at).toLocaleString("en-GB")}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant={viewingLead.contacted ? "outline" : "default"}
                  onClick={() => {
                    handleMarkContacted(viewingLead);
                    setViewingLead({
                      ...viewingLead,
                      contacted: !viewingLead.contacted,
                    });
                  }}
                  className="flex-1 gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5" />{" "}
                  {viewingLead.contacted
                    ? "Unmark Contacted"
                    : "Mark Contacted"}
                </Button>
                {viewingLead.status === "pending_checkout" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleMarkAbandoned(viewingLead.id);
                      setViewingLead({ ...viewingLead, status: "abandoned" });
                    }}
                    className="gap-1.5"
                  >
                    Mark Abandoned
                  </Button>
                )}
                {viewingLead.status !== "completed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleMarkConverted(viewingLead.id);
                      setViewingLead({ ...viewingLead, status: "completed" });
                    }}
                    className="gap-1.5"
                  >
                    <UserCheck className="h-3.5 w-3.5" /> Converted
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutLeadsManager;
