import React from "react";
import { X, GitMerge } from "lucide-react";

export function ExplainPanel({ plan, onClose }: { plan: any; onClose: () => void }) {
  if (!plan) return null;

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <GitMerge className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-zinc-100">Execution Plan</h2>
        </div>
        <button 
          onClick={onClose}
          className="rounded-sm p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <ExplainNode node={plan} />
      </div>
    </div>
  );
}

function ExplainNode({ node }: { key?: React.Key; node: any }) {
  return (
    <div className="ml-4 mt-2 flex flex-col items-start">
      <div className="flex flex-col rounded-md border border-zinc-700 bg-zinc-900 p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-blue-400">{node.name}</span>
          <span className="text-xs text-zinc-500">cost: {node.cost}</span>
        </div>
        <div className="mt-1 text-xs text-zinc-300">{node.details}</div>
        <div className="mt-1 text-xs text-zinc-500">rows: {node.rows}</div>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="ml-6 border-l-2 border-zinc-800 pl-4">
          {node.children.map((child: any, i: number) => (
            <ExplainNode key={i} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
