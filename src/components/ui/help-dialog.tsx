"use client";

import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface HelpDialogProps {
  title: string;
  content: ReactNode;
  triggerClassName?: string;
}

interface ControlledHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: ReactNode;
}

export function HelpDialog({ title, content, triggerClassName }: HelpDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={triggerClassName}
        aria-label="ดูคู่มือการใช้งาน"
      >
        <HelpCircle className="h-4 w-4" />
        <span className="ml-2">คู่มือ</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-500" />
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-2">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {content}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ControlledHelpDialog({ isOpen, onClose, title, content }: ControlledHelpDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-500" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {content}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Styled content wrapper components
export function HelpSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        {title}
      </h3>
      <div className="text-gray-700 dark:text-gray-300">{children}</div>
    </div>
  );
}

export function HelpList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function HelpSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
      {steps.map((step, index) => (
        <li key={index} className="pl-2">
          {step}
        </li>
      ))}
    </ol>
  );
}

export function HelpWarning({ children }: { children: ReactNode }) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 my-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-xl">⚠️</span>
        </div>
        <div className="ml-3 text-sm text-yellow-700 dark:text-yellow-200">
          {children}
        </div>
      </div>
    </div>
  );
}

export function HelpTip({ children }: { children: ReactNode }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 my-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-xl">💡</span>
        </div>
        <div className="ml-3 text-sm text-blue-700 dark:text-blue-200">
          {children}
        </div>
      </div>
    </div>
  );
}
