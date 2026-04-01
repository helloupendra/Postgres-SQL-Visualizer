import React, { useState, useRef } from "react";
import { Copy, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DataTableProps {
  data: any[];
  columns: string[];
}

export function DataTable({ data, columns: initialColumns }: DataTableProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [draggedCol, setDraggedCol] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, col: string) => {
    setDraggedCol(col);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    if (!draggedCol || draggedCol === col) return;
    
    const newCols = [...columns];
    const draggedIdx = newCols.indexOf(draggedCol);
    const targetIdx = newCols.indexOf(col);
    
    newCols.splice(draggedIdx, 1);
    newCols.splice(targetIdx, 0, draggedCol);
    setColumns(newCols);
  };

  const handleDragEnd = () => {
    setDraggedCol(null);
  };

  const copyCell = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Cell copied to clipboard");
  };

  const copyRow = (row: any) => {
    navigator.clipboard.writeText(JSON.stringify(row, null, 2));
    toast.success("Row copied to clipboard");
  };

  return (
    <div className="min-w-max h-full">
      <table className="w-full text-left text-sm text-zinc-300 border-collapse">
        <thead className="sticky top-0 z-10 bg-zinc-900 text-xs uppercase text-zinc-400 shadow-sm">
          <tr>
            <th className="w-10 border-b border-zinc-800 px-2 py-2 text-center">#</th>
            {columns.map((col) => (
              <th 
                key={col} 
                className="border-b border-zinc-800 border-r border-r-zinc-800/50 last:border-r-0 p-0 font-medium bg-zinc-900"
                draggable
                onDragStart={(e) => handleDragStart(e, col)}
                onDragOver={(e) => handleDragOver(e, col)}
                onDragEnd={handleDragEnd}
              >
                <div className="flex items-center group relative min-w-[100px] max-w-[500px] overflow-hidden resize-x px-3 py-2">
                  <GripVertical className="h-3 w-3 mr-1 opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing" />
                  <span className="truncate flex-1 select-none">{col}</span>
                </div>
              </th>
            ))}
            <th className="border-b border-zinc-800 px-2 py-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="group border-b border-zinc-800/50 hover:bg-zinc-800/30">
              <td className="px-2 py-1.5 text-center text-xs text-zinc-600 border-r border-r-zinc-800/30">{i + 1}</td>
              {columns.map((col) => {
                const val = row[col];
                const displayVal = val !== null && val !== undefined ? String(val) : "null";
                const isNull = val === null || val === undefined;
                
                return (
                  <td 
                    key={col} 
                    className="whitespace-nowrap px-3 py-1.5 border-r border-r-zinc-800/30 last:border-r-0 relative group/cell"
                    onDoubleClick={() => copyCell(displayVal)}
                  >
                    <span className={isNull ? "text-zinc-600 italic" : ""}>{displayVal}</span>
                    <button 
                      onClick={() => copyCell(displayVal)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded bg-zinc-700 text-zinc-300 opacity-0 group-hover/cell:opacity-100 hover:bg-zinc-600 transition-opacity"
                      title="Copy cell"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </td>
                );
              })}
              <td className="px-2 py-1.5 text-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => copyRow(row)}
                      className="p-1 rounded text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-zinc-300 hover:bg-zinc-700 transition-all"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Copy row JSON</TooltipContent>
                </Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
