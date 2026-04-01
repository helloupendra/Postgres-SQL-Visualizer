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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { mockSchema } from "@/data/mock";
import { Key, Link, Table2, Search } from "lucide-react";

const nodeTypes = {
  tableNode: TableNode,
};

function TableNode({ data }: { data: any }) {
  const { searchQuery } = data;
  
  const isTableMatch = searchQuery && data.name.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <div className={`min-w-[220px] overflow-hidden rounded-lg border bg-zinc-900/95 shadow-xl backdrop-blur-sm transition-all ${isTableMatch ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-zinc-700/60'}`}>
      <Handle type="target" position={Position.Top} className="h-2 w-2 rounded-full border-2 border-zinc-900 bg-blue-500" />
      <div className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold border-b ${isTableMatch ? 'bg-blue-900/30 text-blue-100 border-blue-500/50' : 'bg-zinc-800/80 text-zinc-100 border-zinc-700/50'}`}>
        <Table2 className={`h-4 w-4 ${isTableMatch ? 'text-blue-300' : 'text-blue-400'}`} />
        <span>{data.name}</span>
      </div>
      <div className="flex flex-col p-2">
        {data.columns.map((col: any) => {
          const isColMatch = searchQuery && col.name.toLowerCase().includes(searchQuery.toLowerCase());
          return (
            <div key={col.name} className={`flex items-center justify-between py-1.5 text-xs rounded px-1 transition-colors ${isColMatch ? 'bg-blue-900/40' : 'hover:bg-zinc-800/50'}`}>
              <div className="flex items-center gap-1.5">
                {col.isPrimary && <Key className="h-3.5 w-3.5 text-amber-400" />}
                {col.isForeign && <Link className="h-3.5 w-3.5 text-blue-400" />}
                {!col.isPrimary && !col.isForeign && <span className="w-3.5" />}
                <span className={`font-medium ${isColMatch ? 'text-blue-200' : 'text-zinc-300'}`}>{col.name}</span>
              </div>
              <span className={`font-mono text-[10px] ${isColMatch ? 'text-blue-300/70' : 'text-zinc-500'}`}>{col.type}</span>
            </div>
          );
        })}
      </div>
      <Handle type="source" position={Position.Bottom} className="h-2 w-2 rounded-full border-2 border-zinc-900 bg-blue-500" />
    </div>
  );
}

export function SchemaVisualizer() {
  const [searchQuery, setSearchQuery] = useState("");

  // Generate nodes and edges from mockSchema
  const initialNodes = useMemo(() => {
    return mockSchema.map((table, index) => ({
      id: table.id,
      type: "tableNode",
      position: { x: (index % 3) * 300, y: Math.floor(index / 3) * 250 },
      data: { ...table, searchQuery: "" },
    }));
  }, []);

  const initialEdges = useMemo(() => {
    const edges: any[] = [];
    mockSchema.forEach((table) => {
      table.columns.forEach((col) => {
        if (col.isForeign && col.references) {
          const [targetTable] = col.references.split(".");
          edges.push({
            id: `e-${table.id}-${targetTable}`,
            source: targetTable,
            target: table.id,
            animated: true,
            style: { stroke: "#3b82f6", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
          });
        }
      });
    });
    return edges;
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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

  return (
    <div className="relative h-full w-full bg-zinc-950">
      <div className="absolute left-4 top-4 z-10 w-64">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search tables or columns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900/80 py-1.5 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 backdrop-blur-sm"
          />
        </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
      >
        <Background color="#27272a" gap={16} />
        <Controls className="bg-zinc-900 fill-zinc-400 text-zinc-400" />
        <MiniMap nodeColor="#3f3f46" maskColor="rgba(0, 0, 0, 0.5)" />
      </ReactFlow>
    </div>
  );
}
