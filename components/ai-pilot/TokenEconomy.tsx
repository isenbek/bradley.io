"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { TokenEconomy as TokenEconomyType } from "./types";

interface TokenEconomyProps {
  economy: TokenEconomyType;
}

function formatTokens(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="rounded-xl p-2 sm:p-3 text-center"
      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
    >
      <div className="font-mono text-sm sm:text-lg font-bold" style={{ color: "var(--brand-primary)" }}>
        {value}
      </div>
      <div className="text-[9px] sm:text-[10px] uppercase tracking-wide" style={{ color: "var(--brand-muted)" }}>
        {label}
      </div>
    </div>
  );
}

export function TokenEconomy({ economy }: TokenEconomyProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h3 className="text-xs sm:text-sm font-medium" style={{ color: "var(--brand-muted)" }}>
        Token Economy
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <StatCard value={`$${economy.totalCostUSD.toFixed(2)}`} label="Total Cost" />
        <StatCard value={`${economy.cacheEfficiency}%`} label="Cache Hit Rate" />
        <StatCard value={`$${economy.costPerSession}`} label="Cost / Session" />
        <StatCard value={economy.webSearches.toLocaleString()} label="Web Searches" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-xs">
        <div className="space-y-1">
          <div style={{ color: "var(--brand-muted)" }}>Input Tokens</div>
          <div className="font-mono font-bold">{formatTokens(economy.totalInputTokens)}</div>
        </div>
        <div className="space-y-1">
          <div style={{ color: "var(--brand-muted)" }}>Output Tokens</div>
          <div className="font-mono font-bold">{formatTokens(economy.totalOutputTokens)}</div>
        </div>
        <div className="space-y-1">
          <div style={{ color: "var(--brand-muted)" }}>Cache Read</div>
          <div className="font-mono font-bold">{formatTokens(economy.totalCacheReadTokens)}</div>
        </div>
        <div className="space-y-1">
          <div style={{ color: "var(--brand-muted)" }}>Cache Create</div>
          <div className="font-mono font-bold">{formatTokens(economy.totalCacheCreateTokens)}</div>
        </div>
      </div>

      {economy.dailyTokens.length > 0 && (
        <div>
          <h4 className="text-[10px] sm:text-xs font-medium mb-2 sm:mb-3" style={{ color: "var(--brand-muted)" }}>
            Daily Token Usage (Last 30 Days)
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={economy.dailyTokens}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--brand-border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "currentColor" }}
                tickFormatter={(d: string) => d.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "currentColor" }}
                tickFormatter={(v: number) => formatTokens(v)}
              />
              <Tooltip
                content={({ payload, label }) => {
                  if (!payload?.length) return null;
                  return (
                    <div
                      className="rounded-md shadow-md px-3 py-2 text-xs"
                      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
                    >
                      <div className="font-mono font-bold">{label}</div>
                      <div>{formatTokens(payload[0].value as number)} tokens</div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="tokens" fill="var(--brand-primary)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
