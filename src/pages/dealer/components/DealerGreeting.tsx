import React from "react";

interface DealerGreetingProps {
  profile: any; // Ideally this should be a Profile type
}

export function DealerGreeting({ profile }: DealerGreetingProps) {
  const dealerName = profile?.full_name || profile?.email?.split("@")[0] || "Partner";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md border border-slate-700/50">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary text-xl font-bold shrink-0">
          {dealerName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
            {greeting}
          </p>
          <h2 className="text-white text-xl sm:text-2xl font-bold">
            Hello, {dealerName}! 👋
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {profile?.is_approved
              ? "You're an approved partner. Browse & order at exclusive dealer pricing."
              : "Your account is pending approval. You can browse products in the meantime."}
          </p>
        </div>
      </div>
      <div
        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border ${
          profile?.is_approved
            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
        }`}
      >
        {profile?.is_approved ? "✓ Approved Partner" : "⏳ Pending Approval"}
      </div>
    </div>
  );
}
