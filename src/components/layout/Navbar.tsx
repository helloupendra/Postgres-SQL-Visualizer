import { Database, Moon, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShortcutsModal } from "./ShortcutsModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Navbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm">
          <Database className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-zinc-100">Postgres SQL Visualizer</span>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="ml-4 flex cursor-pointer items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-800 transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Connected to e-commerce_db
            </div>
          </TooltipTrigger>
          <TooltipContent>PostgreSQL 15.4 - localhost:5432</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <ShortcutsModal />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <Moon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Theme</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="ml-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors">
              <User className="h-4 w-4" />
            </div>
          </TooltipTrigger>
          <TooltipContent>Profile</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
