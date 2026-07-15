import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Search, Users, Eye, Monitor, Globe, Activity } from "lucide-react";

interface VisitorSession {
  id: string;
  session_id: string;
  visitor_id: string;
  device_type: string;
  browser: string;
  os: string;
  referrer: string;
  entry_page: string;
  exit_page: string;
  country: string;
  city: string;
  ip_address: string;
  is_online: boolean;
  last_active_at: string;
  created_at: string;
}

interface PageView {
  id: string;
  session_id: string;
  visitor_id: string;
  page_url: string;
  page_title: string;
  created_at: string;
}

const useVisitorSessions = () =>
  useQuery({
    queryKey: ["visitor_sessions"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("visitor_sessions") as any)
        .select("*")
        .order("last_active_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data as VisitorSession[];
    },
    refetchInterval: 30_000,
  });

const usePageViews = () =>
  useQuery({
    queryKey: ["page_views"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("page_views") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data as PageView[];
    },
    refetchInterval: 30_000,
  });

const VisitorAnalyticsPage = () => {
  const { data: sessions = [], isLoading: loadingSessions } =
    useVisitorSessions();
  const { data: pageViews = [], isLoading: loadingViews } = usePageViews();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [sourceFilter, setSourceFilter] = useState("all");

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const last7 = new Date(startOfToday.getTime() - 7 * 86400000);
  const last30 = new Date(startOfToday.getTime() - 30 * 86400000);

  const stats = useMemo(() => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000);
    const online = sessions.filter(
      (s) => s.is_online && new Date(s.last_active_at) > fiveMinAgo,
    ).length;
    const todaySessions = sessions.filter(
      (s) => new Date(s.created_at) >= startOfToday,
    );
    const yesterdaySessions = sessions.filter((s) => {
      const d = new Date(s.created_at);
      return d >= startOfYesterday && d < startOfToday;
    });
    const week = sessions.filter((s) => new Date(s.created_at) >= last7);
    const month = sessions.filter((s) => new Date(s.created_at) >= last30);

    const uniqueToday = new Set(todaySessions.map((s) => s.visitor_id)).size;
    const viewsToday = pageViews.filter(
      (p) => new Date(p.created_at) >= startOfToday,
    ).length;

    return {
      online,
      totalVisitors: sessions.length,
      todayVisitors: todaySessions.length,
      yesterdayVisitors: yesterdaySessions.length,
      weekVisitors: week.length,
      monthVisitors: month.length,
      uniqueToday,
      viewsToday,
      totalPageViews: pageViews.length,
      uniqueTotal: new Set(sessions.map((s) => s.visitor_id)).size,
    };
  }, [sessions, pageViews]);

  // Daily chart data
  const dailyData = useMemo(() => {
    const map = new Map<
      string,
      { visitors: number; views: number; unique: Set<string> }
    >();
    const days = dateFilter === "month" ? 30 : dateFilter === "week" ? 7 : 7;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(startOfToday.getTime() - i * 86400000);
      const key = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      map.set(key, { visitors: 0, views: 0, unique: new Set() });
    }
    sessions.forEach((s) => {
      const key = new Date(s.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const entry = map.get(key);
      if (entry) {
        entry.visitors++;
        entry.unique.add(s.visitor_id);
      }
    });
    pageViews.forEach((p) => {
      const key = new Date(p.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const entry = map.get(key);
      if (entry) entry.views++;
    });
    return Array.from(map.entries()).map(([date, d]) => ({
      date,
      visitors: d.visitors,
      unique: d.unique.size,
      views: d.views,
    }));
  }, [sessions, pageViews, dateFilter]);

  // Device breakdown
  const deviceData = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => {
      const dev = s.device_type || "Unknown";
      map.set(dev, (map.get(dev) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [sessions]);

  // Browser breakdown
  const browserData = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => {
      const b = s.browser || "Unknown";
      map.set(b, (map.get(b) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [sessions]);

  // Top pages
  const topPages = useMemo(() => {
    const map = new Map<string, number>();
    pageViews.forEach((p) => {
      map.set(p.page_url, (map.get(p.page_url) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
  }, [pageViews]);

  // Source-filtered sessions
  const sourceFilteredSessions = useMemo(() => {
    if (sourceFilter === "all") return sessions;
    const patterns: Record<string, string[]> = {
      facebook: ["facebook", "fb.com", "fb.me", "fbclid"],
      instagram: ["instagram", "ig.com", "l.instagram"],
      tiktok: ["tiktok", "tiktok.com", "tt."],
    };
    const keywords = patterns[sourceFilter] || [];
    return sessions.filter((s) => {
      const ref = (s.referrer || "").toLowerCase();
      const entry = (s.entry_page || "").toLowerCase();
      return keywords.some((k) => ref.includes(k) || entry.includes(k));
    });
  }, [sessions, sourceFilter]);

  // Filtered session list
  const filteredSessions = useMemo(() => {
    let list = sourceFilteredSessions;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.session_id.toLowerCase().includes(q) ||
          s.visitor_id.toLowerCase().includes(q) ||
          s.entry_page.toLowerCase().includes(q) ||
          s.exit_page.toLowerCase().includes(q) ||
          s.browser.toLowerCase().includes(q) ||
          s.referrer.toLowerCase().includes(q),
      );
    }
    return list.slice(0, 100);
  }, [sourceFilteredSessions, search]);

  const fiveMinAgo = new Date(Date.now() - 5 * 60000);
  const isOnline = (s: VisitorSession) =>
    s.is_online && new Date(s.last_active_at) > fiveMinAgo;

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontFamily: "var(--font-body)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  };
  const gridStroke = "hsl(220, 13%, 91%)";
  const axisStroke = "hsl(220, 10%, 60%)";

  if (loadingSessions || loadingViews) {
    return (
      <p className="text-center py-10 text-muted-foreground font-body">
        Loading analytics...
      </p>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-foreground">
          Visitor Analytics
        </h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Real-time website traffic monitoring
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Online Now",
            value: stats.online,
            icon: Activity,
            accent: true,
          },
          { label: "Today Visitors", value: stats.todayVisitors, icon: Users },
          { label: "Unique Today", value: stats.uniqueToday, icon: Globe },
          { label: "Views Today", value: stats.viewsToday, icon: Eye },
          { label: "Yesterday", value: stats.yesterdayVisitors, icon: Users },
          { label: "Last 7 Days", value: stats.weekVisitors, icon: Users },
          { label: "Last 30 Days", value: stats.monthVisitors, icon: Users },
          { label: "Total Unique", value: stats.uniqueTotal, icon: Monitor },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`border rounded-lg p-5 ${kpi.accent ? "bg-primary/10 border-primary/30" : "bg-card border-border"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon
                className={`w-4 h-4 ${kpi.accent ? "text-primary" : "text-muted-foreground"}`}
              />
              <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                {kpi.label}
              </p>
            </div>
            <p
              className={`font-heading text-2xl font-bold ${kpi.accent ? "text-primary" : "text-foreground"}`}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4 mb-8">
        {/* Visitors Trend */}
        <div className="bg-card border border-border p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-foreground">
              Visitors Trend
            </h3>
            <div className="flex gap-1">
              {["week", "month"].map((f) => (
                <button
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className={`px-3 py-1 text-xs font-body rounded-md transition-colors ${dateFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  {f === "week" ? "7D" : "30D"}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(217, 91%, 56%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(217, 91%, 56%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" stroke={axisStroke} fontSize={11} />
              <YAxis stroke={axisStroke} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="hsl(217, 91%, 56%)"
                fillOpacity={1}
                fill="url(#colorVisitors)"
                strokeWidth={2}
                name="Visitors"
              />
              <Area
                type="monotone"
                dataKey="unique"
                stroke="hsl(142, 71%, 45%)"
                fillOpacity={0}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Unique"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Page Views Trend */}
        <div className="bg-card border border-border p-6 rounded-lg">
          <h3 className="font-heading text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            Page Views
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" stroke={axisStroke} fontSize={11} />
              <YAxis stroke={axisStroke} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="views"
                fill="hsl(217, 91%, 56%)"
                radius={[4, 4, 0, 0]}
                name="Views"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        {/* Devices */}
        <div className="bg-card border border-border p-6 rounded-lg">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider mb-4 text-foreground">
            Devices
          </h3>
          <div className="space-y-3">
            {deviceData.map((d) => {
              const pct =
                sessions.length > 0
                  ? Math.round((d.value / sessions.length) * 100)
                  : 0;
              return (
                <div key={d.name}>
                  <div className="flex justify-between font-body text-sm mb-1">
                    <span className="text-foreground">{d.name}</span>
                    <span className="text-muted-foreground">
                      {d.value} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Browsers */}
        <div className="bg-card border border-border p-6 rounded-lg">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider mb-4 text-foreground">
            Browsers
          </h3>
          <div className="space-y-3">
            {browserData.map((b) => {
              const pct =
                sessions.length > 0
                  ? Math.round((b.value / sessions.length) * 100)
                  : 0;
              return (
                <div key={b.name}>
                  <div className="flex justify-between font-body text-sm mb-1">
                    <span className="text-foreground">{b.name}</span>
                    <span className="text-muted-foreground">
                      {b.value} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-card border border-border p-6 rounded-lg">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider mb-4 text-foreground">
            Top Pages
          </h3>
          <div className="space-y-2">
            {topPages.map((p, i) => (
              <div
                key={p.page}
                className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-heading text-xs font-bold text-primary w-5">
                    #{i + 1}
                  </span>
                  <span className="font-body text-xs text-foreground truncate">
                    {p.page}
                  </span>
                </div>
                <span className="font-body text-xs font-bold text-muted-foreground shrink-0 ml-2">
                  {p.views}
                </span>
              </div>
            ))}
            {topPages.length === 0 && (
              <p className="font-body text-xs text-muted-foreground">
                No data yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Visitor List */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-foreground">
            Recent Visitors
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              {[
                { key: "all", label: "All" },
                { key: "facebook", label: "Facebook" },
                { key: "instagram", label: "Instagram" },
                { key: "tiktok", label: "TikTok" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setSourceFilter(f.key)}
                  className={`px-3 py-1.5 text-xs font-body rounded-md transition-colors ${sourceFilter === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border bg-background rounded-md font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="text-left p-3 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                  Time
                </th>
                <th className="text-left p-3 font-heading text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                  Device
                </th>
                <th className="text-left p-3 font-heading text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                  Browser / OS
                </th>
                <th className="text-left p-3 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                  Entry
                </th>
                <th className="text-left p-3 font-heading text-xs uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                  Exit
                </th>
                <th className="text-left p-3 font-heading text-xs uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                  Referrer
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                >
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-body font-bold uppercase ${isOnline(s) ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isOnline(s) ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`}
                      />
                      {isOnline(s) ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="p-3 font-body text-xs text-foreground whitespace-nowrap">
                    {new Date(s.created_at).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-3 font-body text-xs text-foreground hidden md:table-cell">
                    {s.device_type}
                  </td>
                  <td className="p-3 font-body text-xs text-muted-foreground hidden md:table-cell">
                    {s.browser} / {s.os}
                  </td>
                  <td className="p-3 font-body text-xs text-primary truncate max-w-[120px]">
                    {s.entry_page}
                  </td>
                  <td className="p-3 font-body text-xs text-muted-foreground truncate max-w-[120px] hidden lg:table-cell">
                    {s.exit_page}
                  </td>
                  <td className="p-3 font-body text-xs text-muted-foreground truncate max-w-[150px] hidden lg:table-cell">
                    {s.referrer || "Direct"}
                  </td>
                </tr>
              ))}
              {filteredSessions.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground font-body text-sm"
                  >
                    No visitor data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VisitorAnalyticsPage;
