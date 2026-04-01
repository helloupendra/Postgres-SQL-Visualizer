/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Workspace } from "@/components/layout/Workspace";
import { Toaster, toast } from "sonner";
import { mockSavedQueries } from "@/data/mock";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function App() {
  const [tabs, setTabs] = useState([{ id: "1", name: "query-1.sql", query: mockSavedQueries[0].sql }]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [savedQueries, setSavedQueries] = useState(mockSavedQueries);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  React.useEffect(() => {
    toast("Welcome to Postgres SQL Visualizer", {
      description: "Connected to mock e-commerce database. Try running a query!",
      duration: 5000,
    });
  }, []);

  const handleSelectQuery = (sql: string, name?: string) => {
    const newId = Date.now().toString();
    setTabs([...tabs, { id: newId, name: name || `query-${tabs.length + 1}.sql`, query: sql }]);
    setActiveTabId(newId);
  };

  const handleSaveQuery = (name: string, sql: string) => {
    setSavedQueries([...savedQueries, { id: Date.now().toString(), name, sql }]);
    toast.success(`Query "${name}" saved to favorites`);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={20} minSize={15} maxSize={30} collapsible={true}>
              <Sidebar onSelectQuery={handleSelectQuery} savedQueries={savedQueries} />
            </Panel>
            
            <PanelResizeHandle className="w-1 bg-zinc-900 hover:bg-blue-500/50 transition-colors cursor-col-resize flex items-center justify-center">
              <div className="h-8 w-0.5 rounded-full bg-zinc-700" />
            </PanelResizeHandle>
            
            <Panel defaultSize={80} minSize={50}>
              <main className="h-full w-full overflow-hidden bg-zinc-950">
                <Workspace 
                  tabs={tabs}
                  setTabs={setTabs}
                  activeTabId={activeTabId}
                  setActiveTabId={setActiveTabId}
                  onSaveQuery={handleSaveQuery}
                  setExecutionTime={setExecutionTime}
                />
              </main>
            </Panel>
          </PanelGroup>
        </div>
        
        {/* Status Footer */}
        <footer className="flex h-6 items-center justify-between border-t border-zinc-800 bg-zinc-950 px-4 text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span>PostgreSQL 15.4</span>
            <span>UTF8</span>
          </div>
          <div className="flex items-center gap-4">
            {executionTime !== null && (
              <span className="text-emerald-500 font-mono">Execution time: {executionTime}ms</span>
            )}
            <span>Auto-commit: ON</span>
            <span>Ready</span>
          </div>
        </footer>

        <Toaster theme="dark" position="bottom-right" />
      </div>
    </TooltipProvider>
  );
}
