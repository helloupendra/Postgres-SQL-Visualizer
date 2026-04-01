import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { SQLEditor } from "@/components/editor/SQLEditor";
import { SchemaVisualizer } from "@/components/schema/SchemaVisualizer";
import { ResultsPanel } from "@/components/results/ResultsPanel";
import { ExplainPanel } from "@/components/results/ExplainPanel";
import { mockSavedQueries } from "@/data/mock";
import { toast } from "sonner";
import { motion } from "motion/react";
import { X } from "lucide-react";

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
  const [isSchemaVisible, setIsSchemaVisible] = useState(true);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const sampleQuery = mockSavedQueries[0];

  const handleQueryChange = (val: string) => {
    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, query: val } : t));
  };

  const handleRunQuery = async () => {
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

  const handleLoadSampleQuery = () => {
    if (!activeTab) return;

    setTabs(
      tabs.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              name: tab.query.trim() ? tab.name : "sample-revenue.sql",
              query: sampleQuery.sql,
            }
          : tab,
      ),
    );
    setResultsTab("results");
    toast.success(`Loaded sample query: ${sampleQuery.name}`);
  };

  return (
    <PanelGroup direction="horizontal" className="h-full w-full overflow-hidden bg-zinc-950">
      {/* Left Panel: Editor & Results */}
      <Panel defaultSize={58} minSize={28}>
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
              isSchemaVisible={isSchemaVisible}
              onToggleSchema={() => setIsSchemaVisible(!isSchemaVisible)}
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

      {isSchemaVisible && (
        <>
          <ResizeHandle direction="horizontal" />

          {/* Right Panel: Schema Visualizer */}
          <Panel defaultSize={42} minSize={24} maxSize={55}>
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="h-full bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.06),transparent_34%),linear-gradient(180deg,#05070b,#090c11)] p-2 pl-1.5"
            >
              <SchemaVisualizer
                onClose={() => setIsSchemaVisible(false)}
                onLoadSampleQuery={handleLoadSampleQuery}
              />
            </motion.div>
          <Panel defaultSize={40} minSize={20}>
            <div className="flex h-full flex-col border-l border-zinc-800/80 bg-zinc-950/40 relative">
              <div className="flex items-center justify-between border-b border-zinc-800/60 bg-zinc-950/80 px-5 py-3 backdrop-blur-md z-20 shadow-sm">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-zinc-100 tracking-wide">Schema Visualizer</h2>
                  <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-blue-400">
                    e-commerce_db
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsSchemaVisible(false)}
                    className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                    title="Close Schema Visualizer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="relative flex-1 overflow-hidden bg-zinc-950">
                <SchemaVisualizer />
              </div>
            </div>
          </Panel>
        </>
      )}
    </PanelGroup>
  );
}

function ResizeHandle({ direction }: { direction: "horizontal" | "vertical" }) {
  return (
    <PanelResizeHandle
      className={`group relative flex items-center justify-center bg-transparent transition-colors ${
        direction === "horizontal" ? "w-3 -mx-1 cursor-col-resize" : "h-3 -my-1 cursor-row-resize"
      }`}
    >
      <div
        className={`rounded-full bg-zinc-800/90 transition-all duration-200 group-hover:bg-cyan-300/70 ${
          direction === "horizontal" ? "h-20 w-px group-hover:h-24" : "h-px w-20 group-hover:w-24"
        }`}
      />
    </PanelResizeHandle>
  );
}
