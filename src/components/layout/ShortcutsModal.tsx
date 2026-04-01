import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ShortcutsModal() {
  return (
    <Dialog.Root>
      <Tooltip>
        <TooltipTrigger asChild>
          <Dialog.Trigger asChild>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <Keyboard className="h-4 w-4" />
            </Button>
          </Dialog.Trigger>
        </TooltipTrigger>
        <TooltipContent>Keyboard Shortcuts</TooltipContent>
      </Tooltip>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-zinc-100">Keyboard Shortcuts</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-zinc-100">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          
          <div className="space-y-4">
            <ShortcutRow label="Run Query" keys={["â", "Enter"]} />
            <ShortcutRow label="Format SQL" keys={["â", "Shift", "F"]} />
            <ShortcutRow label="Save Query" keys={["â", "S"]} />
            <ShortcutRow label="Toggle Sidebar" keys={["â", "B"]} />
            <ShortcutRow label="Find" keys={["â", "F"]} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ShortcutRow({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-300">{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd key={i} className="flex h-6 min-w-[24px] items-center justify-center rounded border border-zinc-700 bg-zinc-800 px-1.5 text-[11px] font-medium text-zinc-300 shadow-sm">
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}
