import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, FileText, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  reviewed: "bg-blue-100 text-blue-700",
  interviewed: "bg-purple-100 text-purple-700",
  rejected: "bg-red-100 text-red-700",
  hired: "bg-green-100 text-green-700",
};

const statuses = ["pending", "reviewed", "interviewed", "rejected", "hired"];

export default function JobApplicationsManager() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: applications = [], isLoading: loading } = useQuery({
    queryKey: ["job_applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const filtered = useMemo(() => {
    if (statusFilter === "all") return applications;
    return applications.filter((a) => a.status === statusFilter);
  }, [applications, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: applications.length };
    statuses.forEach((s) => {
      counts[s] = applications.filter((a) => a.status === s).length;
    });
    return counts;
  }, [applications]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["job_applications"] });
      toast.success("Status updated");
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const deleteApplication = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete application from ${name}?`,
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("job_applications")
        .delete()
        .eq("id", id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["job_applications"] });
      toast.success("Application deleted");
    } catch (error: any) {
      toast.error("Failed to delete application");
    }
  };

  if (loading)
    return (
      <p className="text-center py-10 text-muted-foreground font-body">
        Loading applications...
      </p>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-foreground">
            Job Applications
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {applications.length} total applications
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {["all", ...statuses].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-md font-body text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 text-xs opacity-70">
              ({statusCounts[s] || 0})
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-body text-muted-foreground">
              No applications found in this category.
            </p>
          </div>
        ) : (
          filtered.map((app) => (
            <div
              key={app.id}
              className="bg-card border border-border p-6 rounded-lg hover:border-primary/20 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-heading text-xl font-bold uppercase text-foreground">
                      {app.full_name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-body font-bold rounded-full uppercase ${statusColors[app.status] || ""}`}
                    >
                      {app.status}
                    </span>
                  </div>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    Applied on: {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {app.cv_url && (
                    <a
                      href={app.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-primary/20 hover:border-primary text-primary"
                      >
                        <FileText className="h-3.5 w-3.5" /> View CV
                      </Button>
                    </a>
                  )}
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app.id, e.target.value)}
                    className="px-4 py-2 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteApplication(app.id, app.full_name)}
                    className="gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Contact Details
                  </p>
                  <p className="font-body text-sm font-semibold text-foreground">
                    {app.email}
                  </p>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    {app.phone}
                  </p>
                </div>
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Application Info
                  </p>
                  <p className="font-body text-sm text-foreground">
                    Position:{" "}
                    <span className="font-semibold text-primary">
                      {app.position}
                    </span>
                  </p>
                  {app.cover_letter && (
                    <div className="mt-2 bg-background p-3 rounded border border-border text-sm text-foreground/80 italic font-body">
                      "{app.cover_letter}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
