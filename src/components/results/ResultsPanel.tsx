import React, { useState } from "react";
import { Table, BarChart2, GitMerge, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { mockExplainPlan } from "@/data/mock";

interface ResultsPanelProps {
  data: any[] | null;
  queryName: string | null;
  isLoading: boolean;
  activeTab: "results" | "chart" | "explain";
  onTabChange: (tab: "results" | "chart" | "explain") => void;
}

export function ResultsPanel({ data, queryName, isLoading, activeTab, onTabChange }: ResultsPanelProps) {
  const handleExport = () => {
    toast.success("Results exported to CSV");
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col bg-zinc-950 p-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <div className="h-6 w-24 animate-pulse rounded bg-zinc-800"></div>
          <div className="h-6 w-24 animate-pulse rounded bg-zinc-800"></div>
        </div>
        <div className="mt-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-full animate-pulse rounded bg-zinc-800/50"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-zinc-950 text-zinc-500">
        <Table className="mb-2 h-8 w-8 opacity-50" />
        <p>Run a query to see results</p>
      </div>
    );
  }

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-2 py-1">
        <div className="flex items-center gap-1">
          <TabButton
            active={activeTab === "results"}
            onClick={() => setActiveTab("results")}
            icon={Table}
            label="Results"
          />
          <TabButton
            active={activeTab === "chart"}
            onClick={() => setActiveTab("chart")}
            icon={BarChart2}
            label="Charts"
          />
          <TabButton
            active={activeTab === "explain"}
            onClick={() => setActiveTab("explain")}
            icon={GitMerge}
            label="Explain"
          />
        </div>
        
        <div className="flex items-center gap-2 pr-2">
          <span className="text-xs text-zinc-500">{data.length} rows</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleExport} className="h-7 gap-1 text-xs text-zinc-400 hover:text-zinc-100">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export CSV</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-0">
        {activeTab === "results" && (
          <div className="min-w-max">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="sticky top-0 bg-zinc-900 text-xs uppercase text-zinc-400 shadow-sm">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="border-b border-zinc-800 px-4 py-2 font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    {columns.map((col) => (
                      <td key={col} className="whitespace-nowrap px-4 py-2">
                        {row[col] !== null ? String(row[col]) : <span className="text-zinc-600">null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "chart" && (
          <div className="flex h-full flex-col p-4">
            <h3 className="mb-4 text-sm font-medium text-zinc-300">{queryName || "Query Results"}</h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {columns.length >= 2 ? (
                  <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                    <XAxis dataKey={columns[0]} stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                      itemStyle={{ color: '#60a5fa' }}
                    />
                    <Bar dataKey={columns[1]} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                    Not enough numeric columns for charting
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "explain" && (
          <div className="p-4">
            <ExplainNode node={mockExplainPlan} />
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function ExplainNode({ node }: { key?: React.Key; node: any }) {
  return (
    <div className="ml-4 mt-2 flex flex-col items-start">
      <div className="flex flex-col rounded-md border border-zinc-700 bg-zinc-900 p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-blue-400">{node.name}</span>
          <span className="text-xs text-zinc-500">cost: {node.cost}</span>
        </div>
        <div className="mt-1 text-xs text-zinc-300">{node.details}</div>
        <div className="mt-1 text-xs text-zinc-500">rows: {node.rows}</div>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="ml-6 border-l-2 border-zinc-800 pl-4">
          {node.children.map((child: any, i: number) => (
            <ExplainNode key={i} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
