import { useState, useEffect } from "react";
import { usePageContent, useUpsertPageContent } from "@/hooks/usePageContents";
import { toast } from "sonner";
import { Car, Save } from "lucide-react";

const VehicleDataManager = () => {
  const { data: filterSettingsPage, isLoading } =
    usePageContent("filter-settings");
  const upsertPage = useUpsertPageContent();
  const [filterForm, setFilterForm] = useState({
    years: "2024, 2023, 2022",
    models: "Sedan, SUV, Truck",
  });

  useEffect(() => {
    if (filterSettingsPage?.content) {
      try {
        const parsed = JSON.parse(filterSettingsPage.content);
        setFilterForm({
          years: (parsed.years || []).join(", "),
          models: (parsed.models || []).join(", "),
        });
      } catch (e) {}
    } else if (!isLoading && !filterSettingsPage) {
      setFilterForm({
        years: "2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015",
        models: "Sedan, SUV, Truck, Sports",
      });
    }
  }, [filterSettingsPage, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertPage.mutateAsync({
        page_slug: "filter-settings",
        page_title: "Filter Settings",
        content: JSON.stringify({
          years: filterForm.years
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          models: filterForm.models
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
        is_active: true,
      });
      toast.success("Vehicle data saved");
    } catch (err: any) {
      toast.error("Failed to save");
    }
  };

  if (isLoading)
    return (
      <p className="text-center py-10 text-muted-foreground">Loading...</p>
    );

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-lg">
          <Car className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-foreground">
            Vehicle Data
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Manage dropdown options for Years and Models
          </p>
        </div>
      </div>

      <div className="bg-card border border-border p-6 rounded-lg max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="font-body text-xs text-muted-foreground mb-4">
            Note: Vehicle Makes (Brands) are automatically generated from your
            active products.
          </p>
          <div>
            <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Available Years (comma separated)
            </label>
            <textarea
              value={filterForm.years}
              onChange={(e) =>
                setFilterForm({ ...filterForm, years: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <div>
            <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Available Models (comma separated)
            </label>
            <textarea
              value={filterForm.models}
              onChange={(e) =>
                setFilterForm({ ...filterForm, models: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={upsertPage.isPending}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {upsertPage.isPending ? "Saving..." : "Save Data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleDataManager;
