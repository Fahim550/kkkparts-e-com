import { useState, useEffect } from "react";
import { Clock, Flame } from "lucide-react";

const CountdownTimer = () => {
  const [time, setTime] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    // Always count down from 24h based on current time within the day
    const tick = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = Math.max(0, endOfDay.getTime() - now.getTime());
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTime({ hours, minutes, seconds });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Flame className="w-4 h-4 text-destructive animate-pulse" />
        <span className="font-heading text-sm font-bold text-destructive uppercase tracking-wider">
          Limited Time Offer!
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="font-body text-sm text-muted-foreground">
          Sale ends in:
        </span>
        <div className="flex gap-1 ml-1">
          {[
            { value: pad(time.hours), label: "H" },
            { value: pad(time.minutes), label: "M" },
            { value: pad(time.seconds), label: "S" },
          ].map((unit, i) => (
            <span key={i} className="flex items-center">
              <span className="bg-foreground text-background font-heading text-sm font-bold px-1.5 py-0.5 rounded">
                {unit.value}
              </span>
              <span className="font-body text-[10px] text-muted-foreground ml-0.5 mr-1">
                {unit.label}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
