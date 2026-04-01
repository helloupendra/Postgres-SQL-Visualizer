import { useCallback, useMemo } from "react";
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
import { Key, Link, Table2 } from "lucide-react";

const nodeTypes = {
  tableNode: TableNode,
};

function TableNode({ data }: { data: any }) {
  return (
    <div className="min-w-[220px] overflow-hidden rounded-lg border border-zinc-700/60 bg-zinc-900/95 shadow-xl backdrop-blur-sm">
      <Handle type="target" position={Position.Top} className="h-2 w-2 rounded-full border-2 border-zinc-900 bg-blue-500" />
      <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-2 text-sm font-semibold text-zinc-100 border-b border-zinc-700/50">
        <Table2 className="h-4 w-4 text-blue-400" />
        <span>{data.name}</span>
      </div>
      <div className="flex flex-col p-2">
        {data.columns.map((col: any) => (
          <div key={col.name} className="flex items-center justify-between py-1.5 text-xs hover:bg-zinc-800/50 rounded px-1 transition-colors">
            <div className="flex items-center gap-1.5">
              {col.isPrimary && <Key className="h-3.5 w-3.5 text-amber-400" />}
              {col.isForeign && <Link className="h-3.5 w-3.5 text-blue-400" />}
              {!col.isPrimary && !col.isForeign && <span className="w-3.5" />}
              <span className="text-zinc-300 font-medium">{col.name}</span>
            </div>
            <span className="text-zinc-500 font-mono text-[10px]">{col.type}</span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} className="h-2 w-2 rounded-full border-2 border-zinc-900 bg-blue-500" />
    </div>
  );
}

export function SchemaVisualizer() {
  // Generate nodes and edges from mockSchema
  const initialNodes = useMemo(() => {
    return mockSchema.map((table, index) => ({
      id: table.id,
      type: "tableNode",
      position: { x: (index % 3) * 300, y: Math.floor(index / 3) * 250 },
      data: table,
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

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  return (
    <div className="h-full w-full bg-zinc-950">
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
