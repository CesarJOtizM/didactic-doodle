'use client';

import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

type TriggerProps = {
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
};

type ResponsiveCommandPopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Props for the trigger button */
  triggerProps: TriggerProps;
  /** Content to render inside the popover/sheet (typically a <Command>) */
  children: React.ReactNode;
  /** Popover width class for desktop (default: "w-80") */
  popoverClassName?: string;
  /** PopoverContent align prop for desktop (default: "start") */
  align?: PopoverPrimitive.Positioner.Props['align'];
  /** Accessible title for the sheet on mobile */
  sheetTitle?: string;
  /** Accessible description for the sheet on mobile */
  sheetDescription?: string;
};

/**
 * Renders a Popover on desktop and a bottom Sheet on mobile.
 * Designed for Command-based selection lists (publisher selectors, etc.).
 *
 * On mobile, content slides up from the bottom as a sheet (max 70dvh),
 * leaving the page context visible at the top.
 */
export function ResponsiveCommandPopover({
  open,
  onOpenChange,
  triggerProps,
  children,
  popoverClassName = 'w-80',
  align = 'start',
  sheetTitle = 'Select',
  sheetDescription,
}: ResponsiveCommandPopoverProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          className={triggerProps.className}
          disabled={triggerProps.disabled}
          onClick={() => onOpenChange(true)}
        >
          {triggerProps.children}
        </button>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="bottom"
            className="max-h-[70dvh] rounded-t-2xl px-0 pb-[env(safe-area-inset-bottom,0px)]"
            showCloseButton={false}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>{sheetTitle}</SheetTitle>
              {sheetDescription && (
                <SheetDescription>{sheetDescription}</SheetDescription>
              )}
            </SheetHeader>
            {/* Drag handle indicator */}
            <div className="flex justify-center pb-2">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            {children}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        className={triggerProps.className}
        disabled={triggerProps.disabled}
      >
        {triggerProps.children}
      </PopoverTrigger>
      <PopoverContent className={`${popoverClassName} p-0`} align={align}>
        {children}
      </PopoverContent>
    </Popover>
  );
}
