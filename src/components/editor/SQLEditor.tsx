import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { PanelRightClose, PanelRightOpen, Play, Save, FileCode2, History, AlignLeft, Clock, X, Plus, GitMerge, ChevronDown, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { mockSchema } from "@/data/mock";

interface SQLEditorProps {
  value: string;
  onChange: (val: string) => void;
  onRun: () => void;
  onExplain: () => void;
  onSave: (name: string) => void;
  isRunning: boolean;
  history?: { query: string; timestamp: Date }[];
  tabs: { id: string; name: string; query: string }[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  onTabAdd: () => void;
  onTabClose: (id: string) => void;
  isSchemaVisible: boolean;
  onToggleSchema: () => void;
}

export function SQLEditor({ 
  value, 
  onChange, 
  onRun, 
  onExplain,
  onSave,
  isRunning, 
  history = [],
  tabs,
  activeTabId,
  onTabChange,
  onTabAdd,
  onTabClose,
  isSchemaVisible,
  onToggleSchema
}: SQLEditorProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  const sqlSchema = useMemo(() => {
    return mockSchema.reduce((acc, table) => {
      acc[table.name] = table.columns.map(c => c.name);
      return acc;
    }, {} as Record<string, string[]>);
  }, []);

  const handleFormat = (style: string = "Standard") => {
    toast.success(`SQL formatted successfully (${style})`);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;
    onSave(saveName);
    setIsSaveOpen(false);
    setSaveName("");
  };

  const insertSnippet = (snippet: string) => {
    onChange(value ? `${value}\n\n${snippet}` : snippet);
  };

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-2 py-1">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "group flex items-center gap-2 rounded-t-md px-3 py-2 text-sm cursor-pointer border-b-2 transition-colors",
                activeTabId === tab.id
                  ? "bg-[#1e1e1e] text-zinc-300 border-blue-500"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 border-transparent"
              )}
            >
              <FileCode2 className={cn("h-4 w-4", activeTabId === tab.id ? "text-blue-400" : "")} />
              {tab.name}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className="ml-1 rounded-sm p-0.5 opacity-0 hover:bg-zinc-700 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={onTabAdd} 
                className="ml-1 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>New Query</TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex items-center gap-2 pr-2">
          <Dialog.Root open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Dialog.Trigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-zinc-400 hover:text-zinc-100">
                    <History className="h-3.5 w-3.5" />
                    History
                  </Button>
                </Dialog.Trigger>
              </TooltipTrigger>
              <TooltipContent>Query History</TooltipContent>
            </Tooltip>
            
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
              <Dialog.Content className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-zinc-800 bg-zinc-950 p-4 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
                <div className="mb-4 flex items-center justify-between">
                  <Dialog.Title className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                    <History className="h-4 w-4" />
                    Query History
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-zinc-100">
                      <X className="h-4 w-4" />
                    </Button>
                  </Dialog.Close>
                </div>
                
                <div className="flex-1 space-y-2 overflow-y-auto pr-2">
                  {history.length === 0 ? (
                    <div className="mt-10 text-center text-xs text-zinc-500">No history yet. Run a query to see it here.</div>
                  ) : (
                    history.map((item, i) => (
                      <div 
                        key={i} 
                        className="group flex cursor-pointer flex-col gap-1 rounded-md border border-zinc-800 bg-zinc-900/50 p-2 transition-colors hover:bg-zinc-800"
                        onClick={() => {
                          onChange(item.query);
                          setIsHistoryOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                          <Clock className="h-3 w-3" />
                          {item.timestamp.toLocaleTimeString()}
                        </div>
                        <div className="line-clamp-3 break-all font-mono text-xs text-zinc-300">
                          {item.query}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          
          <DropdownMenu.Root>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu.Trigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-zinc-400 hover:text-zinc-100">
                    <Code className="h-3.5 w-3.5" />
                    Snippets
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenu.Trigger>
              </TooltipTrigger>
              <TooltipContent>Insert SQL Snippet</TooltipContent>
            </Tooltip>

            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                align="end"
                className="z-50 min-w-[10rem] overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 p-1 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
              >
                <DropdownMenu.Item 
                  onClick={() => insertSnippet("SELECT * FROM table_name;")}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors focus:bg-zinc-800 focus:text-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-zinc-300"
                >
                  SELECT
                </DropdownMenu.Item>
                <DropdownMenu.Item 
                  onClick={() => insertSnippet("INSERT INTO table_name (column1, column2)\nVALUES (value1, value2);")}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors focus:bg-zinc-800 focus:text-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-zinc-300"
                >
                  INSERT
                </DropdownMenu.Item>
                <DropdownMenu.Item 
                  onClick={() => insertSnippet("UPDATE table_name\nSET column1 = value1\nWHERE condition;")}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors focus:bg-zinc-800 focus:text-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-zinc-300"
                >
                  UPDATE
                </DropdownMenu.Item>
                <DropdownMenu.Item 
                  onClick={() => insertSnippet("DELETE FROM table_name\nWHERE condition;")}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors focus:bg-zinc-800 focus:text-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-zinc-300"
                >
                  DELETE
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <DropdownMenu.Root>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu.Trigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-zinc-400 hover:text-zinc-100">
                    <AlignLeft className="h-3.5 w-3.5" />
                    Format
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenu.Trigger>
              </TooltipTrigger>
              <TooltipContent>Format SQL Options</TooltipContent>
            </Tooltip>

            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                align="end"
                className="z-50 min-w-[10rem] overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 p-1 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
              >
                <DropdownMenu.Item 
                  onClick={() => handleFormat("Standard")}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors focus:bg-zinc-800 focus:text-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-zinc-300"
                >
                  Standard Format
                </DropdownMenu.Item>
                <DropdownMenu.Item 
                  onClick={() => handleFormat("Compact")}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors focus:bg-zinc-800 focus:text-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-zinc-300"
                >
                  Compact Format
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="-mx-1 my-1 h-px bg-zinc-800" />
                <DropdownMenu.Item 
                  onClick={() => handleFormat("Uppercase Keywords")}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors focus:bg-zinc-800 focus:text-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-zinc-300"
                >
                  Uppercase Keywords
                </DropdownMenu.Item>
                <DropdownMenu.Item 
                  onClick={() => handleFormat("Lowercase Keywords")}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors focus:bg-zinc-800 focus:text-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-zinc-300"
                >
                  Lowercase Keywords
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onExplain} className="h-7 gap-1 text-xs text-zinc-400 hover:text-zinc-100">
                <GitMerge className="h-3.5 w-3.5" />
                Explain
              </Button>
            </TooltipTrigger>
            <TooltipContent>Explain Query</TooltipContent>
          </Tooltip>
          
          <Dialog.Root open={isSaveOpen} onOpenChange={setIsSaveOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Dialog.Trigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-zinc-400 hover:text-zinc-100">
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </Button>
                </Dialog.Trigger>
              </TooltipTrigger>
              <TooltipContent>Save Query (âŒ˜S)</TooltipContent>
            </Tooltip>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
                <Dialog.Title className="text-lg font-semibold text-zinc-100 mb-4">Save Query</Dialog.Title>
                <form onSubmit={handleSaveSubmit}>
                  <input
                    autoFocus
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    placeholder="Query name..."
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="mt-4 flex justify-end gap-2">
                    <Dialog.Close asChild>
                      <Button type="button" variant="ghost" className="text-zinc-400 hover:text-zinc-100">Cancel</Button>
                    </Dialog.Close>
                    <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Save</Button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSchema}
                className={cn(
                  "h-8 gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all duration-200",
                  isSchemaVisible
                    ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-[0_10px_20px_rgba(6,182,212,0.12)] hover:bg-cyan-300/14 hover:text-white"
                    : "border-transparent text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/90 hover:text-zinc-100",
                )}
              >
              <Button variant="ghost" size="sm" onClick={onToggleSchema} className="h-7 gap-1 text-xs text-zinc-400 hover:text-zinc-100">
                {isSchemaVisible ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
                Schema
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isSchemaVisible ? "Hide Schema Visualizer" : "Show Schema Visualizer"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                onClick={onRun} 
                disabled={isRunning}
                className="h-8 gap-1.5 rounded-xl bg-[linear-gradient(135deg,#10b981,#059669)] px-4 text-xs font-semibold text-white shadow-[0_14px_28px_rgba(5,150,105,0.22)] hover:brightness-110"
              >
                <Play className="h-3.5 w-3.5" />
                {isRunning ? "Running..." : "Run Query"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Execute Query (âŒ˜Enter)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* CodeMirror Editor */}
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={value}
          height="100%"
          theme="dark"
          extensions={[sql({ schema: sqlSchema })]}
          onChange={onChange}
          className="h-full text-sm"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
          }}
        />
      </div>
    </div>
  );
}
