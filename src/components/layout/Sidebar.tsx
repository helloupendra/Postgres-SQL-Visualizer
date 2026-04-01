import React, { useState } from "react";
import { ChevronRight, Database, Search, Table2, LayoutTemplate, FunctionSquare, Folder, FileCode2 } from "lucide-react";
import { mockSchema } from "@/data/mock";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onSelectQuery: (sql: string, name?: string) => void;
  savedQueries: { id: string; name: string; sql: string }[];
}

export function Sidebar({ onSelectQuery, savedQueries }: SidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    schemas: true,
    public: true,
    tables: true,
    saved: true,
  });

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <aside className="flex h-full w-full flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-300">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search tables, views..."
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {/* Database Explorer */}
        <div className="mb-4">
          <div className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Explorer</div>
          
          <TreeItem icon={Database} label="e-commerce_db" expanded={expanded.schemas} onClick={() => toggle("schemas")}>
            <TreeItem icon={Folder} label="Schemas" expanded={expanded.public} onClick={() => toggle("public")}>
              <TreeItem icon={Folder} label="public" expanded={expanded.tables} onClick={() => toggle("tables")}>
                
                <TreeItem icon={Folder} label="Tables" expanded={expanded.tablesList} onClick={() => toggle("tablesList")}>
                  {mockSchema.map(table => (
                    <TreeItem key={table.id} icon={Table2} label={table.name} isLeaf />
                  ))}
                </TreeItem>

                <TreeItem icon={Folder} label="Views" expanded={expanded.views} onClick={() => toggle("views")}>
                  <TreeItem icon={LayoutTemplate} label="monthly_sales_view" isLeaf />
                  <TreeItem icon={LayoutTemplate} label="active_users_view" isLeaf />
                </TreeItem>

                <TreeItem icon={Folder} label="Functions" expanded={expanded.funcs} onClick={() => toggle("funcs")}>
                  <TreeItem icon={FunctionSquare} label="calculate_tax()" isLeaf />
                </TreeItem>

              </TreeItem>
            </TreeItem>
          </TreeItem>
        </div>

        {/* Saved Queries */}
        <div>
          <div className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Saved Queries</div>
          <TreeItem icon={Folder} label="All Queries" expanded={expanded.saved} onClick={() => toggle("saved")}>
            {savedQueries.map(q => (
              <div 
                key={q.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-800 hover:text-zinc-100"
                onClick={() => onSelectQuery(q.sql, q.name)}
              >
                <FileCode2 className="h-4 w-4 text-blue-400" />
                <span className="truncate">{q.name}</span>
              </div>
            ))}
          </TreeItem>
        </div>
      </div>
    </aside>
  );
}

function TreeItem({ 
  icon: Icon, 
  label, 
  expanded, 
  onClick, 
  children, 
  isLeaf 
}: { 
  key?: React.Key,
  icon: any, 
  label: string, 
  expanded?: boolean, 
  onClick?: () => void, 
  children?: React.ReactNode,
  isLeaf?: boolean
}) {
  return (
    <div className="ml-2">
      <div 
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-800 hover:text-zinc-100",
          isLeaf ? "pl-6" : ""
        )}
        onClick={onClick}
      >
        {!isLeaf && (
          <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")} />
        )}
        <Icon className="h-4 w-4 text-zinc-400" />
        <span className="truncate">{label}</span>
      </div>
      {expanded && children && <div className="ml-2 border-l border-zinc-800">{children}</div>}
    </div>
  );
}
