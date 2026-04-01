import { useCallback, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
  BackgroundVariant,
  NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { mockSchema } from "@/data/mock";
import { Key, Link, Table2, Search, Filter, X, Database, Info, Layers, MousePointer2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const nodeTypes = {
  tableNode: TableNode,
};

function TableNode({ data, selected }: { data: any, selected?: boolean }) {
  const { searchQuery } = data;
  
  const isTableMatch = searchQuery && (
    data.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (data.description && data.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const hasColumnMatch = searchQuery && data.columns.some((col: any) => col.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const hasMatch = isTableMatch || hasColumnMatch;
  const isDimmed = searchQuery && !hasMatch;

  return (
    <div className={`group min-w-[280px] overflow-hidden rounded-xl border bg-zinc-950/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out
      ${selected ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-blue-900/20' : isTableMatch ? 'border-blue-500/50 ring-1 ring-blue-500/30' : 'border-zinc-800/80 hover:border-zinc-700'} 
      ${isDimmed ? 'opacity-30 grayscale scale-95' : 'opacity-100 scale-100 hover:shadow-xl hover:-translate-y-0.5'}
    `}>
      <Handle type="target" position={Position.Top} className="h-2 w-2 rounded-full border-2 border-zinc-950 bg-zinc-500 opacity-0" />
      
      {/* Header */}
      <div className={`flex flex-col gap-1.5 px-4 py-3 border-b transition-colors
        ${selected ? 'bg-blue-950/60 border-blue-900/60' : isTableMatch ? 'bg-blue-950/30 border-blue-900/40' : 'bg-zinc-900/90 border-zinc-800/80 group-hover:bg-zinc-900'}
      `}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2.5 text-sm font-bold tracking-wide ${selected || isTableMatch ? 'text-blue-100' : 'text-zinc-100'}`}>
            <Table2 className={`h-4 w-4 ${selected || isTableMatch ? 'text-blue-400' : 'text-zinc-400 group-hover:text-zinc-300'}`} />
            <span>{data.name}</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950/80 px-1.5 py-0.5 rounded border border-zinc-800/80 shadow-inner">{data.columns.length} cols</span>
        </div>
        {data.description && (
          <div className={`text-[11px] leading-snug mt-0.5 ${selected || isTableMatch ? 'text-blue-200/80' : 'text-zinc-400'}`}>
            {data.description}
          </div>
        )}
      </div>

      {/* Columns */}
      <div className="flex flex-col py-1.5">
        {data.columns.map((col: any) => {
          const isColMatch = searchQuery && col.name.toLowerCase().includes(searchQuery.toLowerCase());
          return (
            <div key={col.name} className={`relative flex items-center justify-between px-4 py-1.5 text-xs transition-colors
              ${isColMatch ? 'bg-blue-900/20' : 'hover:bg-zinc-900/60'}
            `}>
              <div className="flex items-center gap-2.5 overflow-hidden">
                {col.isPrimary ? (
                  <Key className="h-3 w-3 shrink-0 text-amber-500" />
                ) : col.isForeign ? (
                  <Link className="h-3 w-3 shrink-0 text-blue-400" />
                ) : (
                  <div className="h-3 w-3 shrink-0" />
                )}
                <span className={`truncate font-medium ${isColMatch ? 'text-blue-200' : 'text-zinc-300'}`}>
                  {col.name}
                </span>
              </div>
              <span className="ml-4 shrink-0 font-mono text-[10px] text-zinc-500">
                {col.type}
              </span>
              
              {/* Handle for foreign keys */}
              <Handle
                type="source"
                position={Position.Bottom}
                id={col.name}
                className="h-2 w-2 rounded-full border-2 border-zinc-950 bg-zinc-500 opacity-0"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SchemaVisualizer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchema, setSelectedSchema] = useState<string>("all");
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);

  const availableSchemas = useMemo(() => {
    const schemas = new Set<string>();
    mockSchema.forEach(table => {
      if (table.schema) schemas.add(table.schema);
    });
    return Array.from(schemas).sort();
  }, []);

  // Generate nodes and edges from mockSchema
  const initialNodes = useMemo(() => {
    const filteredTables = selectedSchema === "all" 
      ? mockSchema 
      : mockSchema.filter(t => t.schema === selectedSchema);

    return filteredTables.map((table, index) => ({
      id: table.id,
      type: "tableNode",
      position: { x: (index % 3) * 350, y: Math.floor(index / 3) * 300 },
      data: { ...table, searchQuery: "" },
    }));
  }, [selectedSchema]);

  const initialEdges = useMemo(() => {
    const filteredTables = selectedSchema === "all" 
      ? mockSchema 
      : mockSchema.filter(t => t.schema === selectedSchema);
      
    const tableIds = new Set(filteredTables.map(t => t.id));
    
    const edges: any[] = [];
    filteredTables.forEach((table) => {
      table.columns.forEach((col) => {
        if (col.isForeign && col.references) {
          const [targetTable] = col.references.split(".");
          // Only add edge if target table is also in the current view
          if (tableIds.has(targetTable)) {
            edges.push({
              id: `e-${table.id}-${targetTable}`,
              source: targetTable,
              target: table.id,
              animated: true,
              style: { stroke: "#3b82f6", strokeWidth: 1.5, opacity: 0.6 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
            });
          }
        }
      });
    });
    return edges;
  }, [selectedSchema]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when selected schema changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          searchQuery,
        },
      }))
    );
  }, [searchQuery, setNodes]);

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedTable(node.data);
  }, []);

  return (
    <div className="relative h-full w-full bg-zinc-950 overflow-hidden">
      
      {/* Top Left Controls */}
      <div className="absolute left-6 top-6 z-40 flex flex-col gap-2">
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950/80 p-3 shadow-2xl backdrop-blur-xl transition-all duration-300">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <Filter className="h-3.5 w-3.5" />
              <span>Schema Filters</span>
            </div>
            <button
              onClick={() => setIsControlsVisible(!isControlsVisible)}
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
            >
              {isControlsVisible ? <X className="h-3.5 w-3.5" /> : <Filter className="h-3.5 w-3.5" />}
            </button>
          </div>

          <AnimatePresence>
            {isControlsVisible && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex w-64 flex-col gap-2.5 overflow-hidden"
              >
                {availableSchemas.length > 0 && (
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <select
                      value={selectedSchema}
                      onChange={(e) => setSelectedSchema(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-900/50 py-2 pl-9 pr-3 text-sm text-zinc-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer"
                    >
                      <option value="all">All Schemas</option>
                      {availableSchemas.map(schema => (
                        <option key={schema} value={schema}>{schema}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="relative flex items-center">
                  <Search className="absolute left-3 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search tables or columns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Onboarding Card */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute right-6 top-6 z-50 w-80 overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-900/95 p-5 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner">
                <Database className="h-5 w-5" />
              </div>
              <button
                onClick={() => setShowOnboarding(false)}
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-100">Welcome to Postgres Visualizer</h3>
            <p className="mb-5 text-xs leading-relaxed text-zinc-400">
              Explore the mock e-commerce schema, inspect table relationships, and run sample PostgreSQL queries.
            </p>
            
            <div className="mb-5 flex flex-col gap-2.5 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <MousePointer2 className="h-3.5 w-3.5" />
                <span>Drag to pan, scroll to zoom</span>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5" />
                <span>Search tables and columns</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setShowOnboarding(false)}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                Explore Schema
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
        minZoom={0.1}
        maxZoom={1.5}
        defaultEdgeOptions={{
          style: { strokeWidth: 1.5, stroke: '#3b82f6', opacity: 0.6 },
          type: 'smoothstep',
        }}
      >
        <Background color="#3f3f46" gap={24} size={1.5} variant={BackgroundVariant.Dots} />
        <Controls 
          className="bg-zinc-900/90 fill-zinc-400 text-zinc-400 border-zinc-800 shadow-xl backdrop-blur-md rounded-lg overflow-hidden" 
          showInteractive={false}
        />
        <MiniMap 
          nodeColor="#3f3f46" 
          maskColor="rgba(0, 0, 0, 0.6)" 
          className="bg-zinc-950/80 border-zinc-800 shadow-2xl rounded-xl overflow-hidden backdrop-blur-md" 
        />
      </ReactFlow>

      {/* Table Details Drawer */}
      <AnimatePresence>
        {selectedTable && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm"
              onClick={() => setSelectedTable(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 right-0 top-0 z-50 flex w-96 flex-col border-l border-zinc-800/60 bg-zinc-950/95 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800/60 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <Table2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{selectedTable.name}</h3>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      {selectedTable.schema || 'public'} schema
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5">
                {selectedTable.description && (
                  <div className="mb-6 rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-3">
                    <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-zinc-300">
                      <FileText className="h-3.5 w-3.5" />
                      Description
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-400">
                      {selectedTable.description}
                    </p>
                  </div>
                )}

                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Columns</h4>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                    {selectedTable.columns.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {selectedTable.columns.map((col: any) => (
                    <div key={col.name} className="flex flex-col gap-1.5 rounded-lg border border-zinc-800/40 bg-zinc-900/30 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {col.isPrimary ? (
                            <Key className="h-3.5 w-3.5 text-amber-500" />
                          ) : col.isForeign ? (
                            <Link className="h-3.5 w-3.5 text-blue-400" />
                          ) : (
                            <div className="h-3.5 w-3.5" />
                          )}
                          <span className="text-sm font-medium text-zinc-200">{col.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800/60">
                          {col.type}
                        </span>
                      </div>
                      
                      {(col.isPrimary || col.isForeign || col.description) && (
                        <div className="ml-5.5 mt-1 flex flex-col gap-1">
                          {col.isPrimary && (
                            <span className="text-[10px] font-medium text-amber-500/80">Primary Key</span>
                          )}
                          {col.isForeign && (
                            <span className="text-[10px] font-medium text-blue-400/80">
                              References: {col.references}
                            </span>
                          )}
                          {col.description && (
                            <span className="text-xs text-zinc-500">{col.description}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
