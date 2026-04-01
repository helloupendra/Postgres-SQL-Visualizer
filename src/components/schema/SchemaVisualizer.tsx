import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  type Edge,
  Handle,
  MiniMap,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Database,
  FileText,
  GitBranch,
  Key,
  Layers,
  Link as LinkIcon,
  Lock,
  Maximize2,
  Play,
  Search,
  Table2,
  Unlock,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockSchema, type Table } from "@/data/mock";

type ViewMode = "all" | "tables" | "relations";

type SchemaNodeData = Table & {
  activeTableId: string | null;
  matchedColumns: string[];
  relationCount: number;
  relatedTableIds: string[];
  searchQuery: string;
};

type SchemaNode = Node<SchemaNodeData, "tableNode">;

type TableRelation = {
  source: string;
  sourceColumn: string;
  target: string;
  targetColumn: string;
};

type SchemaVisualizerProps = {
  onClose: () => void;
  onLoadSampleQuery?: () => void;
};

const PANEL_DATABASE_NAME = "e-commerce_db";
const DEFAULT_VIEW_MODE: ViewMode = "all";

const INITIAL_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  categories: { x: 80, y: 150 },
  users: { x: 470, y: 70 },
  products: { x: 60, y: 510 },
  orders: { x: 500, y: 390 },
  order_items: { x: 955, y: 340 },
  payments: { x: 980, y: 690 },
  inventory: { x: 540, y: 835 },
};

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  all: "All",
  tables: "Tables",
  relations: "Relations",
};

const nodeTypes = {
  tableNode: TableNodeCard,
};

export function SchemaVisualizer({ onClose, onLoadSampleQuery }: SchemaVisualizerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<SchemaNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("all");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const availableSchemas = useMemo(() => {
    const schemas = new Set<string>();
    mockSchema.forEach((table) => {
      if (table.schema) {
        schemas.add(table.schema);
      }
    });
    return Array.from(schemas).sort();
  }, []);

  const { relationMap, relationCounts, totalRelations, tableLookup } = useMemo(() => {
    const nextRelationMap = new Map<string, { incoming: TableRelation[]; outgoing: TableRelation[] }>();
    const nextRelationCounts = new Map<string, number>();
    const nextTableLookup = new Map<string, Table>();

    mockSchema.forEach((table) => {
      nextRelationMap.set(table.id, { incoming: [], outgoing: [] });
      nextRelationCounts.set(table.id, 0);
      nextTableLookup.set(table.id, table);
      nextTableLookup.set(table.name, table);
    });

    mockSchema.forEach((table) => {
      table.columns.forEach((column) => {
        if (!column.isForeign || !column.references) {
          return;
        }

        const [targetName, targetColumn = "id"] = column.references.split(".");
        const targetTable = nextTableLookup.get(targetName);

        if (!targetTable) {
          return;
        }

        const relation = {
          source: table.id,
          sourceColumn: column.name,
          target: targetTable.id,
          targetColumn,
        };

        nextRelationMap.get(table.id)?.outgoing.push(relation);
        nextRelationMap.get(targetTable.id)?.incoming.push(relation);
        nextRelationCounts.set(table.id, (nextRelationCounts.get(table.id) ?? 0) + 1);
        nextRelationCounts.set(targetTable.id, (nextRelationCounts.get(targetTable.id) ?? 0) + 1);
      });
    });

    return {
      relationMap: nextRelationMap,
      relationCounts: nextRelationCounts,
      tableLookup: nextTableLookup,
      totalRelations: Array.from(nextRelationMap.values()).reduce((count, relationGroup) => count + relationGroup.outgoing.length, 0),
    };
  }, []);

  const visibleTables = useMemo(() => {
    if (selectedSchema === "all") {
      return mockSchema;
    }

    return mockSchema.filter((table) => table.schema === selectedSchema);
  }, [selectedSchema]);

  const searchSummary = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return {
        columnMatches: 0,
        tableMatches: visibleTables.length,
      };
    }

    return visibleTables.reduce(
      (summary, table) => {
        const tableMatch =
          table.name.toLowerCase().includes(normalizedQuery) ||
          table.schema?.toLowerCase().includes(normalizedQuery) ||
          table.description?.toLowerCase().includes(normalizedQuery);

        const matchedColumns = table.columns.filter(
          (column) =>
            column.name.toLowerCase().includes(normalizedQuery) ||
            column.type.toLowerCase().includes(normalizedQuery) ||
            column.references?.toLowerCase().includes(normalizedQuery),
        );

        if (tableMatch || matchedColumns.length > 0) {
          summary.tableMatches += 1;
        }

        summary.columnMatches += matchedColumns.length;
        return summary;
      },
      { columnMatches: 0, tableMatches: 0 },
    );
  }, [deferredSearchQuery, visibleTables]);

  const selectedTable = useMemo(() => {
    if (!selectedTableId) {
      return null;
    }

    return visibleTables.find((table) => table.id === selectedTableId) ?? null;
  }, [selectedTableId, visibleTables]);

  const selectedRelations = useMemo(() => {
    if (!selectedTableId) {
      return null;
    }

    return relationMap.get(selectedTableId) ?? null;
  }, [relationMap, selectedTableId]);

  useEffect(() => {
    if (!selectedTableId) {
      return;
    }

    if (!visibleTables.some((table) => table.id === selectedTableId)) {
      setSelectedTableId(null);
    }
  }, [selectedTableId, visibleTables]);

  useEffect(() => {
    setNodes((currentNodes) => {
      const currentPositions = new Map(currentNodes.map((node) => [node.id, node.position]));
      const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

      return visibleTables.map((table, index) => {
        const existingPosition = currentPositions.get(table.id);
        const fallbackPosition =
          INITIAL_NODE_POSITIONS[table.id] ?? {
            x: 120 + (index % 3) * 360,
            y: 140 + Math.floor(index / 3) * 280,
          };

        const matchedColumns = normalizedQuery
          ? table.columns
              .filter(
                (column) =>
                  column.name.toLowerCase().includes(normalizedQuery) ||
                  column.type.toLowerCase().includes(normalizedQuery) ||
                  column.references?.toLowerCase().includes(normalizedQuery),
              )
              .map((column) => column.name)
          : [];

        const relatedTableIds = relationMap.get(table.id)
          ? [
              ...relationMap.get(table.id)!.incoming.map((relation) => relation.source),
              ...relationMap.get(table.id)!.outgoing.map((relation) => relation.target),
            ]
          : [];

        return {
          id: table.id,
          type: "tableNode",
          position: existingPosition ?? fallbackPosition,
          selected: table.id === selectedTableId,
          draggable: !isCanvasLocked,
          data: {
            ...table,
            activeTableId: selectedTableId,
            matchedColumns,
            relationCount: relationCounts.get(table.id) ?? 0,
            relatedTableIds,
            searchQuery: deferredSearchQuery,
          },
        };
      });
    });
  }, [deferredSearchQuery, isCanvasLocked, relationCounts, relationMap, selectedTableId, setNodes, visibleTables]);

  useEffect(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    const visibleTableIds = new Set(visibleTables.map((table) => table.id));

    const nextEdges = visibleTables.flatMap((table) =>
      table.columns.flatMap((column) => {
        if (!column.isForeign || !column.references) {
          return [];
        }

        const [targetName, targetColumn = "id"] = column.references.split(".");
        const targetTable = tableLookup.get(targetName);

        if (!targetTable || !visibleTableIds.has(targetTable.id)) {
          return [];
        }

        const isConnectedToSelection =
          selectedTableId !== null && (selectedTableId === table.id || selectedTableId === targetTable.id);

        const edgeMatchesQuery =
          normalizedQuery.length === 0 ||
          table.name.toLowerCase().includes(normalizedQuery) ||
          targetTable.name.toLowerCase().includes(normalizedQuery) ||
          column.name.toLowerCase().includes(normalizedQuery) ||
          targetColumn.toLowerCase().includes(normalizedQuery);

        return [
          {
            id: `${table.id}-${column.name}-${targetTable.id}`,
            source: table.id,
            target: targetTable.id,
            hidden: viewMode === "tables",
            label: isConnectedToSelection ? `${column.name} -> ${targetColumn}` : undefined,
            labelBgPadding: [8, 4] as [number, number],
            labelBgBorderRadius: 10,
            labelStyle: {
              fill: "#cbd5e1",
              fontSize: 10,
              fontWeight: 600,
            },
            labelBgStyle: {
              fill: "#0b1017",
              fillOpacity: 0.92,
              stroke: "rgba(120, 138, 166, 0.24)",
              strokeWidth: 1,
            },
            animated: isConnectedToSelection || viewMode === "relations",
            style: {
              opacity: isConnectedToSelection ? 0.98 : edgeMatchesQuery ? (viewMode === "relations" ? 0.74 : 0.42) : 0.14,
              stroke: isConnectedToSelection ? "#67e8f9" : edgeMatchesQuery ? "#2dd4bf" : "#27435e",
              strokeWidth: isConnectedToSelection ? 2.5 : viewMode === "relations" ? 1.9 : 1.35,
              filter: isConnectedToSelection ? "drop-shadow(0 0 8px rgba(34, 211, 238, 0.34))" : undefined,
            },
            type: "smoothstep",
          } satisfies Edge,
        ];
      }),
    );

    setEdges(nextEdges);
  }, [deferredSearchQuery, selectedTableId, setEdges, tableLookup, viewMode, visibleTables]);

  const handleNodeClick: NodeMouseHandler<SchemaNode> = (_, node) => {
    setSelectedTableId(node.id);
    setShowOnboarding(false);
  };

  const handleExploreSchema = () => {
    setShowOnboarding(false);
  };

  const handleLoadSample = () => {
    setShowOnboarding(false);
    onLoadSampleQuery?.();
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[#1d2632] bg-[linear-gradient(180deg,#0d1218,#0a0f14)] shadow-[0_20px_70px_rgba(2,6,23,0.48)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.08),transparent_30%)]" />

      <div className="relative border-b border-white/6 bg-[linear-gradient(180deg,rgba(14,19,27,0.94),rgba(11,16,22,0.92))] backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/14 bg-cyan-300/8 text-cyan-100">
              <GitBranch className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-[15px] font-semibold tracking-[0.01em] text-zinc-50">Schema Visualizer</h2>
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/16 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {PANEL_DATABASE_NAME}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                <span>{visibleTables.length} tables</span>
                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span>{totalRelations} relations</span>
                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span>click a node for details</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/8 bg-white/[0.03] p-2 text-zinc-400 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.07] hover:text-zinc-100"
            title="Collapse schema visualizer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-[#0c1218] via-[#0c1218]/70 to-transparent" />

        <div className="absolute inset-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onPaneClick={() => setSelectedTableId(null)}
            colorMode="dark"
            fitView
            fitViewOptions={{ duration: 600, maxZoom: 1.05, padding: 0.2 }}
            maxZoom={1.55}
            minZoom={0.45}
            nodeTypes={nodeTypes}
            nodesConnectable={false}
            nodesDraggable={!isCanvasLocked}
            panOnDrag={!isCanvasLocked}
            panOnScroll={!isCanvasLocked}
            selectionOnDrag={false}
            zoomOnPinch={!isCanvasLocked}
            zoomOnScroll={!isCanvasLocked}
          >
            <Background color="#1a2535" gap={26} size={1.35} variant={BackgroundVariant.Dots} />

            <AutoFitView fitKey={selectedSchema} />

            <Panel position="bottom-left" className="!m-6">
              <CanvasControls isCanvasLocked={isCanvasLocked} onToggleCanvasLock={() => setIsCanvasLocked((locked) => !locked)} />
            </Panel>

            <Panel position="bottom-right" className="!m-5">
              <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#0b1118]/92 p-1.5 shadow-[0_16px_40px_rgba(2,6,23,0.4)] backdrop-blur-xl">
                <div className="flex items-center justify-between px-2 pb-1.5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Map</p>
                    <p className="mt-1 text-[11px] text-zinc-400">Viewport</p>
                  </div>
                  <span className="rounded-full border border-white/8 bg-white/4 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                    {visibleTables.length}
                  </span>
                </div>

                <MiniMap
                  className="!h-[118px] !w-[190px] !overflow-hidden !rounded-[14px] !border !border-white/8 !bg-[#081019]/95"
                  maskColor="rgba(4, 10, 18, 0.78)"
                  nodeColor={(node) => (node.selected ? "#67e8f9" : "#1f2937")}
                  nodeStrokeColor={() => "#3d5a73"}
                  pannable
                  zoomable
                />
              </div>
            </Panel>
          </ReactFlow>
        </div>

        <AnimatePresence>
          {selectedTable && selectedRelations && (
            <TableDetailsDrawer
              relationMap={selectedRelations}
              table={selectedTable}
              tableLookup={tableLookup}
              onClose={() => setSelectedTableId(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TableNodeCard({ data, selected }: NodeProps<SchemaNode>) {
  const normalizedQuery = data.searchQuery.trim().toLowerCase();
  const tableMatchesQuery =
    normalizedQuery.length > 0 &&
    (data.name.toLowerCase().includes(normalizedQuery) ||
      data.schema?.toLowerCase().includes(normalizedQuery) ||
      data.description?.toLowerCase().includes(normalizedQuery));
  const hasColumnMatch = data.matchedColumns.length > 0;
  const hasMatch = normalizedQuery.length === 0 || tableMatchesQuery || hasColumnMatch;
  const isConnectedToSelection =
    data.activeTableId !== null && data.relatedTableIds.includes(data.activeTableId);

  return (
    <div
      className={cn(
        "group relative w-[312px] overflow-hidden rounded-[20px] border bg-[linear-gradient(180deg,rgba(16,22,31,0.98),rgba(11,15,22,0.98))] shadow-[0_14px_34px_rgba(2,6,23,0.38)] transition-all duration-200 ease-out",
        selected
          ? "border-cyan-300/44 shadow-[0_20px_48px_rgba(34,211,238,0.14)]"
          : tableMatchesQuery || hasColumnMatch
            ? "border-teal-300/24 shadow-[0_18px_40px_rgba(45,212,191,0.1)]"
            : "border-[#243141] hover:border-[#31445a]",
        isConnectedToSelection && !selected && "border-cyan-400/22",
        !hasMatch && "scale-[0.99] opacity-35 saturate-50",
        hasMatch && "hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(2,6,23,0.42)]",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-[#09111b] !bg-[#32485f]"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-[#09111b] !bg-[#32485f]"
      />

      <div className="border-b border-white/6 bg-[linear-gradient(135deg,rgba(20,28,40,0.94),rgba(14,19,28,0.9))] px-4 py-3.5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/8 bg-white/4 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                {data.schema ?? "public"}
              </span>
              <span className="rounded-full border border-cyan-400/14 bg-cyan-400/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                {data.relationCount} rel
              </span>
            </div>

            <div className="flex items-center gap-2 text-zinc-50">
              <Table2 className="h-4 w-4 text-cyan-200" />
              <span className="truncate text-sm font-semibold tracking-[0.02em]">{data.name}</span>
            </div>

            {data.description && (
              <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-zinc-400">{data.description}</p>
            )}
          </div>

          <div className="rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Columns</div>
            <div className="mt-1 text-base font-semibold text-zinc-100">{data.columns.length}</div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 p-2.5">
        {data.columns.map((column) => {
          const isMatchedColumn = data.matchedColumns.includes(column.name);
          const columnStatus = column.isPrimary ? "PK" : column.isForeign ? "FK" : "COL";

          return (
            <div
              key={column.name}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-[14px] px-3 py-2.5 transition-colors duration-200",
                isMatchedColumn ? "bg-cyan-400/10" : "bg-white/[0.02] hover:bg-white/[0.045]",
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {column.isPrimary ? (
                  <Key className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                ) : column.isForeign ? (
                  <LinkIcon className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                ) : (
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full border border-zinc-600/80 bg-zinc-700/80" />
                )}
                <span className={cn("truncate text-[12px] font-medium", isMatchedColumn ? "text-cyan-100" : "text-zinc-200")}>
                  {column.name}
                </span>
              </div>

              <span
                className={cn(
                  "rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                  column.isPrimary
                    ? "border-amber-300/18 bg-amber-300/10 text-amber-200"
                    : column.isForeign
                      ? "border-cyan-300/18 bg-cyan-300/10 text-cyan-200"
                      : "border-white/8 bg-white/5 text-zinc-400",
                )}
              >
                {columnStatus}
              </span>

              <span className="whitespace-nowrap font-mono text-[10px] text-zinc-500">{column.type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type FilterToolbarProps = {
  availableSchemas: string[];
  searchQuery: string;
  searchSummary: {
    columnMatches: number;
    tableMatches: number;
  };
  selectedSchema: string;
  setSearchQuery: (value: string) => void;
  setSelectedSchema: (value: string) => void;
  setViewMode: (value: ViewMode) => void;
  viewMode: ViewMode;
};

function FilterToolbar({
  availableSchemas,
  searchQuery,
  searchSummary,
  selectedSchema,
  setSearchQuery,
  setSelectedSchema,
  setViewMode,
  viewMode,
}: FilterToolbarProps) {
  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
        <Layers className="h-3.5 w-3.5 text-zinc-500" />
        Filters
      </div>

      <div className="relative w-[190px] max-w-full">
        <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <select
          value={selectedSchema}
          onChange={(event) => setSelectedSchema(event.target.value)}
          className="w-full appearance-none rounded-xl border border-white/8 bg-[#0d141d]/88 py-2.5 pl-10 pr-10 text-sm font-medium text-zinc-100 outline-none transition-colors focus:border-cyan-300/25"
        >
          <option value="all">All schemas</option>
          {availableSchemas.map((schema) => (
            <option key={schema} value={schema}>
              {schema}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      </div>

      <label className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search tables, columns, relations"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-xl border border-white/8 bg-[#0d141d]/88 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-cyan-300/25"
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(VIEW_MODE_LABELS) as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={cn(
              "rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition-all duration-200",
              viewMode === mode
                ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                : "border-white/8 bg-white/[0.03] text-zinc-400 hover:border-white/12 hover:text-zinc-100",
            )}
          >
            {VIEW_MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
          <Table2 className="h-3.5 w-3.5 text-zinc-500" />
          {searchSummary.tableMatches} tables
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
          <LinkIcon className="h-3.5 w-3.5 text-zinc-500" />
          {searchSummary.columnMatches} matches
        </span>
      </div>
    </div>
  );
}

type OnboardingBannerProps = {
  onClose: () => void;
  onExploreSchema: () => void;
  onLoadSampleQuery: () => void;
};

function OnboardingBanner({ onClose, onExploreSchema, onLoadSampleQuery }: OnboardingBannerProps) {
  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-[18px] border border-white/8 bg-[linear-gradient(90deg,rgba(16,24,34,0.94),rgba(11,16,23,0.82))] px-4 py-3 shadow-[0_12px_28px_rgba(2,6,23,0.28)]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/14 bg-cyan-300/10 text-cyan-100">
        <Database className="h-4 w-4" />
      </div>

      <div className="min-w-[240px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-zinc-50">Welcome to Postgres SQL Visualizer</p>
          <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Mock schema
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-5 text-zinc-400">
          Explore the e-commerce schema, search tables instantly, and load a sample query without blocking the graph.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onExploreSchema}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)] transition-transform duration-200 hover:-translate-y-0.5"
        >
          Explore
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onLoadSampleQuery}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-white/14 hover:bg-white/[0.08]"
        >
          <Play className="h-4 w-4" />
          Run Sample
        </button>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/8 bg-white/[0.03] p-2 text-zinc-400 transition-colors hover:border-white/12 hover:bg-white/[0.08] hover:text-zinc-100"
          title="Dismiss welcome banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

type CanvasControlsProps = {
  isCanvasLocked: boolean;
  onToggleCanvasLock: () => void;
};

function CanvasControls({ isCanvasLocked, onToggleCanvasLock }: CanvasControlsProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow<SchemaNode, Edge>();

  return (
    <div className="flex items-center gap-2 rounded-[18px] border border-white/10 bg-[#0b1118]/92 p-2 shadow-[0_14px_34px_rgba(2,6,23,0.38)] backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <ToolbarButton icon={ZoomIn} label="Zoom in" onClick={() => void zoomIn({ duration: 160 })} />
        <ToolbarButton icon={ZoomOut} label="Zoom out" onClick={() => void zoomOut({ duration: 160 })} />
        <ToolbarButton
          icon={Maximize2}
          label="Fit view"
          onClick={() => void fitView({ duration: 380, maxZoom: 1.05, padding: 0.2 })}
        />
        <ToolbarButton
          active={isCanvasLocked}
          icon={isCanvasLocked ? Unlock : Lock}
          label={isCanvasLocked ? "Unlock canvas" : "Lock canvas"}
          onClick={onToggleCanvasLock}
        />
      </div>

      <div className="h-8 w-px bg-white/8" />

      <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
        {isCanvasLocked ? "Locked" : "Canvas"}
      </span>
    </div>
  );
}

type ToolbarButtonProps = {
  active?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
};

function ToolbarButton({ active = false, icon: Icon, label, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200",
        active
          ? "border-cyan-300/24 bg-cyan-300/12 text-cyan-100"
          : "border-white/8 bg-white/[0.035] text-zinc-300 hover:border-white/12 hover:bg-white/[0.07] hover:text-white",
      )}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

type TableDetailsDrawerProps = {
  relationMap: {
    incoming: TableRelation[];
    outgoing: TableRelation[];
  };
  table: Table;
  tableLookup: Map<string, Table>;
  onClose: () => void;
};

function TableDetailsDrawer({ relationMap, table, tableLookup, onClose }: TableDetailsDrawerProps) {
  return (
    <>
      <motion.button
        type="button"
        aria-label="Close table details"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 z-40 bg-slate-950/48 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <motion.aside
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 32 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="absolute bottom-4 right-4 top-4 z-50 w-[400px] max-w-[calc(100%-2rem)] overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,20,30,0.98),rgba(9,13,20,0.98))] shadow-[0_30px_80px_rgba(2,6,23,0.6)]"
      >
        <div className="relative h-full overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_52%)]" />

          <div className="relative flex h-full flex-col">
            <div className="border-b border-white/8 px-6 pb-5 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/16 bg-cyan-300/10 text-cyan-100">
                    <Table2 className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-zinc-50">{table.name}</h3>
                      <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                        {table.schema ?? "public"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      {table.description ?? "Core table inside the mock e-commerce schema."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-white/8 bg-white/[0.04] p-2 text-zinc-400 transition-colors hover:border-white/12 hover:bg-white/[0.08] hover:text-zinc-100"
                  title="Close table details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <SummaryStat
                  icon={Table2}
                  label="Columns"
                  value={String(table.columns.length)}
                />
                <SummaryStat
                  icon={ArrowLeft}
                  label="Incoming"
                  value={String(relationMap.incoming.length)}
                />
                <SummaryStat
                  icon={ArrowRight}
                  label="Outgoing"
                  value={String(relationMap.outgoing.length)}
                />
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  <GitBranch className="h-3.5 w-3.5" />
                  Relationship map
                </div>

                <div className="space-y-3">
                  {relationMap.incoming.length === 0 && relationMap.outgoing.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/8 bg-[#0c141c]/70 px-4 py-5 text-sm text-zinc-500">
                      No foreign-key relationships in this filtered view.
                    </div>
                  ) : (
                    <>
                      {relationMap.incoming.map((relation) => {
                        const sourceTable = tableLookup.get(relation.source);

                        return (
                          <RelationRow
                            key={`incoming-${relation.source}-${relation.sourceColumn}`}
                            directionLabel="Incoming"
                            leftLabel={sourceTable?.name ?? relation.source}
                            rightLabel={`${table.name}.${relation.targetColumn}`}
                            accent="cyan"
                            subtitle={`${sourceTable?.name ?? relation.source}.${relation.sourceColumn}`}
                          />
                        );
                      })}

                      {relationMap.outgoing.map((relation) => {
                        const targetTable = tableLookup.get(relation.target);

                        return (
                          <RelationRow
                            key={`outgoing-${relation.target}-${relation.sourceColumn}`}
                            directionLabel="Outgoing"
                            leftLabel={`${table.name}.${relation.sourceColumn}`}
                            rightLabel={targetTable?.name ?? relation.target}
                            accent="blue"
                            subtitle={`${targetTable?.name ?? relation.target}.${relation.targetColumn}`}
                          />
                        );
                      })}
                    </>
                  )}
                </div>
              </section>

              <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  <FileText className="h-3.5 w-3.5" />
                  Columns
                </div>

                <div className="space-y-2">
                  {table.columns.map((column) => (
                    <div
                      key={column.name}
                      className="rounded-[18px] border border-white/8 bg-[#0d141c]/80 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {column.isPrimary ? (
                              <Key className="h-3.5 w-3.5 text-amber-300" />
                            ) : column.isForeign ? (
                              <LinkIcon className="h-3.5 w-3.5 text-cyan-300" />
                            ) : (
                              <div className="h-2.5 w-2.5 rounded-full border border-zinc-600/80 bg-zinc-700/80" />
                            )}
                            <span className="truncate text-sm font-medium text-zinc-100">{column.name}</span>
                          </div>

                          {(column.isPrimary || column.isForeign) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {column.isPrimary && (
                                <span className="rounded-full border border-amber-300/18 bg-amber-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                                  Primary key
                                </span>
                              )}
                              {column.isForeign && (
                                <span className="rounded-full border border-cyan-300/18 bg-cyan-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                                  Foreign key
                                </span>
                              )}
                            </div>
                          )}

                          {column.references && (
                            <p className="mt-2 text-[12px] text-zinc-400">References {column.references}</p>
                          )}
                        </div>

                        <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1.5 font-mono text-[10px] text-zinc-400">
                          {column.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

type SummaryStatProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
};

function SummaryStat({ icon: Icon, label, value }: SummaryStatProps) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</span>
        <Icon className="h-3.5 w-3.5 text-zinc-500" />
      </div>
      <div className="mt-2 text-2xl font-semibold text-zinc-100">{value}</div>
    </div>
  );
}

type RelationRowProps = {
  accent: "blue" | "cyan";
  directionLabel: string;
  key?: React.Key;
  leftLabel: string;
  rightLabel: string;
  subtitle: string;
};

function RelationRow({ accent, directionLabel, leftLabel, rightLabel, subtitle }: RelationRowProps) {
  const accentClasses =
    accent === "blue"
      ? "border-blue-300/14 bg-blue-300/8 text-blue-100"
      : "border-cyan-300/14 bg-cyan-300/8 text-cyan-100";

  return (
    <div className="rounded-[18px] border border-white/8 bg-[#0d141c]/80 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]", accentClasses)}>
          {directionLabel}
        </span>
        <span className="text-sm font-medium text-zinc-100">{leftLabel}</span>
        <ArrowRight className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-sm font-medium text-zinc-300">{rightLabel}</span>
      </div>
      <p className="mt-2 text-[12px] text-zinc-400">{subtitle}</p>
    </div>
  );
}

function AutoFitView({ fitKey }: { fitKey: string }) {
  const { fitView } = useReactFlow<SchemaNode, Edge>();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void fitView({ duration: 500, maxZoom: 1.05, padding: 0.2 });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [fitKey, fitView]);

  return null;
}
