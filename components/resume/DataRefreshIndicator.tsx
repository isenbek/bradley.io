"use client";

import { useEffect, useState } from "react";

interface DataRefreshIndicatorProps {
  lastUpdated: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function DataRefreshIndicator({
  lastUpdated,
  isLoading = false,
  onRefresh,
}: DataRefreshIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    const updateTimeAgo = () => {
      const date = new Date(lastUpdated);
      const now = new Date();
      const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diff < 60) {
        setTimeAgo(`${diff}s ago`);
      } else if (diff < 3600) {
        setTimeAgo(`${Math.floor(diff / 60)}m ago`);
      } else if (diff < 86400) {
        setTimeAgo(`${Math.floor(diff / 3600)}h ago`);
      } else {
        setTimeAgo(date.toLocaleDateString());
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="flex items-center gap-3 text-sm text-slate-500">
      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${
            isLoading ? "animate-pulse bg-amber-500" : "bg-green-500"
          }`}
        />
        <span className="text-xs uppercase tracking-wide">
          {isLoading ? "Updating" : "Live"}
        </span>
      </div>

      {/* Last updated */}
      <span className="text-xs">Updated {timeAgo}</span>

      {/* Manual refresh */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-xs text-teal-600 hover:text-teal-800 disabled:opacity-50"
        >
          Refresh
        </button>
      )}
    </div>
  );
}
