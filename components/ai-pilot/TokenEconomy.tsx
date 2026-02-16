"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
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

export function TokenEconomy({ economy }: TokenEconomyProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium text-muted-foreground">
        Token Economy
      </h3>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="font-mono text-lg font-bold text-primary">
              ${economy.totalCostUSD.toFixed(2)}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Total Cost
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="font-mono text-lg font-bold text-primary">
              {economy.cacheEfficiency}%
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Cache Hit Rate
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="font-mono text-lg font-bold text-primary">
              ${economy.costPerSession}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Cost / Session
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="font-mono text-lg font-bold text-primary">
              {economy.webSearches.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Web Searches
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="space-y-1">
          <div className="text-muted-foreground">Input Tokens</div>
          <div className="font-mono font-bold">
            {formatTokens(economy.totalInputTokens)}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Output Tokens</div>
          <div className="font-mono font-bold">
            {formatTokens(economy.totalOutputTokens)}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Cache Read</div>
          <div className="font-mono font-bold">
            {formatTokens(economy.totalCacheReadTokens)}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Cache Create</div>
          <div className="font-mono font-bold">
            {formatTokens(economy.totalCacheCreateTokens)}
          </div>
        </div>
      </div>

      {/* Daily token trend */}
      {economy.dailyTokens.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-3">
            Daily Token Usage (Last 30 Days)
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={economy.dailyTokens}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
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
                    <div className="bg-popover text-popover-foreground border rounded-md shadow-md px-3 py-2 text-xs">
                      <div className="font-mono font-bold">{label}</div>
                      <div>
                        {formatTokens(payload[0].value as number)} tokens
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="tokens" fill="#0f4c75" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
