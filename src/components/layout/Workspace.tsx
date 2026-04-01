import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { SQLEditor } from "@/components/editor/SQLEditor";
import { SchemaVisualizer } from "@/components/schema/SchemaVisualizer";
import { ResultsPanel } from "@/components/results/ResultsPanel";
import { ExplainPanel } from "@/components/results/ExplainPanel";
import { mockExplainPlan } from "@/data/mock";
import { toast } from "sonner";

export type QueryHistoryItem = {
  query: string;
  timestamp: Date;
};

interface WorkspaceProps {
  tabs: { id: string; name: string; query: string }[];
  setTabs: (tabs: { id: string; name: string; query: string }[]) => void;
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  onSaveQuery: (name: string, sql: string) => void;
  setExecutionTime: (time: number | null) => void;
}

export function Workspace({ 
  tabs, 
  setTabs, 
  activeTabId, 
  setActiveTabId, 
  onSaveQuery, 
  setExecutionTime 
}: WorkspaceProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [queryName, setQueryName] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [resultsTab, setResultsTab] = useState<"results" | "chart">("results");
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [explainPlan, setExplainPlan] = useState<any | null>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const handleQueryChange = (val: string) => {
    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, query: val } : t));
  };

  const handleRunQuery = () => {
    if (!activeTab?.query.trim()) {
      toast.error("Please enter a query to run");
      return;
    }

    setIsRunning(true);
    setResults(null);
    setQueryName(null);
    setExecutionTime(null);
    setResultsTab("results");
    setIsExplainOpen(false);
    
    setQueryHistory(prev => {
      if (prev.length > 0 && prev[0].query === activeTab.query) return prev;
      return [{ query: activeTab.query, timestamp: new Date() }, ...prev].slice(0, 50);
    });

    const startTime = performance.now();
    
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: activeTab.query })
      });
      
      const resData = await response.json();
      const endTime = performance.now();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to execute query');
      }

      setResults(resData.data);
      setQueryName("Query Results");
      setIsRunning(false);
      setExecutionTime(Math.round(endTime - startTime));
      toast.success(`Query executed successfully. ${resData.rowCount || resData.data.length} rows returned.`);
    } catch (error: any) {
      toast.error(error.message);
      setIsRunning(false);
      setResults([]);
    }
  };

  const handleExplain = async () => {
    if (!activeTab?.query.trim()) {
      toast.error("Please enter a query to explain");
      return;
    }
    setIsRunning(true);
    setIsExplainOpen(true);
    
    try {
      // Just run EXPLAIN query against the database
      const explainSql = `EXPLAIN (FORMAT JSON) ${activeTab.query}`;
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: explainSql })
      });
      
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to explain query');
      }

      // Format the returned explain plan (usually the first row contains the plan)
      // Postgres returns the plan in the first column of the first row
      const planRow = resData.data[0];
      const planKey = Object.keys(planRow)[0];
      setExplainPlan(planRow[planKey][0]); // usually an array of plans
      setIsRunning(false);
    } catch (error: any) {
      toast.error(`Explain failed: ${error.message}`);
      setExplainPlan(null);
      setIsRunning(false);
    }
  };

  const handleTabAdd = () => {
    const newId = Date.now().toString();
    setTabs([...tabs, { id: newId, name: `query-${tabs.length + 1}.sql`, query: "" }]);
    setActiveTabId(newId);
  };

  const handleTabClose = (id: string) => {
    if (tabs.length === 1) return; // Don't close the last tab
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  return (
    <PanelGroup direction="horizontal" className="h-full w-full overflow-hidden bg-zinc-950">
      {/* Left Panel: Editor & Results */}
      <Panel defaultSize={60} minSize={30}>
        <PanelGroup direction="vertical">
          <Panel defaultSize={50} minSize={20}>
            <SQLEditor
              value={activeTab?.query || ""}
              onChange={handleQueryChange}
              onRun={handleRunQuery}
              onExplain={handleExplain}
              onSave={(name) => onSaveQuery(name, activeTab.query)}
              isRunning={isRunning}
              history={queryHistory}
              tabs={tabs}
              activeTabId={activeTabId}
              onTabChange={setActiveTabId}
              onTabAdd={handleTabAdd}
              onTabClose={handleTabClose}
            />
          </Panel>
          
          {isExplainOpen && (
            <>
              <ResizeHandle direction="vertical" />
              <Panel defaultSize={25} minSize={15}>
                <ExplainPanel plan={explainPlan} onClose={() => setIsExplainOpen(false)} />
              </Panel>
            </>
          )}

          <ResizeHandle direction="vertical" />
          
          <Panel defaultSize={isExplainOpen ? 25 : 50} minSize={20}>
            <ResultsPanel 
              data={results} 
              queryName={queryName} 
              isLoading={isRunning && !isExplainOpen} 
              activeTab={resultsTab}
              onTabChange={setResultsTab}
            />
          </Panel>
        </PanelGroup>
      </Panel>

      <ResizeHandle direction="horizontal" />

      {/* Right Panel: Schema Visualizer */}
      <Panel defaultSize={40} minSize={20}>
        <div className="flex h-full flex-col border-l border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
            <h2 className="text-sm font-semibold text-zinc-100">Schema Visualizer</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                e-commerce_db
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <SchemaVisualizer />
          </div>
        </div>
      </Panel>
    </PanelGroup>
  );
}

function ResizeHandle({ direction }: { direction: "horizontal" | "vertical" }) {
  return (
    <PanelResizeHandle
      className={`flex items-center justify-center bg-zinc-900 transition-colors hover:bg-blue-500/50 active:bg-blue-500 ${
        direction === "horizontal" ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize"
      }`}
    >
      <div
        className={`rounded-full bg-zinc-700 ${
          direction === "horizontal" ? "h-8 w-0.5" : "h-0.5 w-8"
        }`}
      />
    </PanelResizeHandle>
  );
}
