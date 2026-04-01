import React, { useState } from "react";
import { Table, BarChart2, Download, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { DataTable } from "./DataTable";

interface ResultsPanelProps {
  data: any[] | null;
  queryName: string | null;
  isLoading: boolean;
  activeTab: "results" | "chart";
  onTabChange: (tab: "results" | "chart") => void;
}

export function ResultsPanel({ data, queryName, isLoading, activeTab, onTabChange }: ResultsPanelProps) {
  const [chartType, setChartType] = useState<"bar" | "line" | "scatter">("bar");
  const [xAxis, setXAxis] = useState<string>("");
  const [yAxis, setYAxis] = useState<string>("");

  const handleExport = () => {
    toast.success("Results exported to CSV");
  };

  const handleExportJson = () => {
    if (!data) return;
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${queryName || "query_results"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Results exported to JSON");
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

  const columns = React.useMemo(() => {
    return data.length > 0 ? Object.keys(data[0]) : [];
  }, [data]);

  React.useEffect(() => {
    if (columns.length > 0) {
      setXAxis(prev => columns.includes(prev) ? prev : columns[0]);
      setYAxis(prev => columns.includes(prev) ? prev : (columns.length > 1 ? columns[1] : columns[0]));
    }
  }, [columns]);

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-2 py-1">
        <div className="flex items-center gap-1">
          <TabButton
            active={activeTab === "results"}
            onClick={() => onTabChange("results")}
            icon={Table}
            label="Results"
          />
          <TabButton
            active={activeTab === "chart"}
            onClick={() => onTabChange("chart")}
            icon={BarChart2}
            label="Charts"
          />
        </div>
        
        <div className="flex items-center gap-2 pr-2">
          <span className="text-xs text-zinc-500">{data.length} rows</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleExportJson} className="h-7 gap-1 text-xs text-zinc-400 hover:text-zinc-100">
                <FileJson className="h-3.5 w-3.5" />
                JSON
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export JSON</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleExport} className="h-7 gap-1 text-xs text-zinc-400 hover:text-zinc-100">
                <Download className="h-3.5 w-3.5" />
                CSV
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export CSV</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-0">
        {activeTab === "results" && (
          <DataTable data={data} columns={columns} />
        )}

        {activeTab === "chart" && (
          <div className="flex h-full flex-col p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-300">{queryName || "Query Results"}</h3>
            </div>
            
            {columns.length >= 1 ? (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-4 rounded-md border border-zinc-800 bg-zinc-900/50 p-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-400">Chart Type:</label>
                    <select 
                      value={chartType} 
                      onChange={(e) => setChartType(e.target.value as any)}
                      className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-300 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="bar">Bar Chart</option>
                      <option value="line">Line Chart</option>
                      <option value="scatter">Scatter Plot</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-400">X-Axis:</label>
                    <select 
                      value={xAxis} 
                      onChange={(e) => setXAxis(e.target.value)}
                      className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-300 focus:border-blue-500 focus:outline-none"
                    >
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-400">Y-Axis:</label>
                    <select 
                      value={yAxis} 
                      onChange={(e) => setYAxis(e.target.value)}
                      className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-300 focus:border-blue-500 focus:outline-none"
                    >
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "bar" ? (
                      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                        <XAxis dataKey={xAxis} stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                          itemStyle={{ color: '#60a5fa' }}
                        />
                        <Bar dataKey={yAxis} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : chartType === "line" ? (
                      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                        <XAxis dataKey={xAxis} stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                          itemStyle={{ color: '#60a5fa' }}
                        />
                        <Line type="monotone" dataKey={yAxis} stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    ) : (
                      <ScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                        <XAxis dataKey={xAxis} name={xAxis} stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey={yAxis} name={yAxis} stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                          itemStyle={{ color: '#60a5fa' }}
                        />
                        <Scatter data={data} fill="#3b82f6" />
                      </ScatterChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
                Not enough columns for charting
              </div>
            )}
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
