import React from 'react';
import { Button } from '~/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import type { ToolbarOption } from './types';

interface ToolbarProps {
  options: ToolbarOption[];
  className?: React.HTMLAttributes<HTMLDivElement>['className'];
  disabled?: boolean;
}

/**
 * Toolbar component for rich text editor formatting buttons
 * Handles both top and bottom toolbars with consistent styling
 */
export function Toolbar({
  options,
  className,
  disabled = false,
}: ToolbarProps) {
  return (
    <div className={`flex flex-wrap items-center gap-1 ${className || ''}`}>
      {options.map((option) => (
        <React.Fragment key={option.id}>
          {option.separator ? (
            <div className="shrink-0 w-[0.5px] mx-1 h-3 bg-border/40"></div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled || option.disabled}
                  className={`size-6 transition-colors ${
                    option.isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground/70 hover:bg-muted/30 hover:text-muted-foreground'
                  }`}
                  aria-label={option.label}
                  onClick={option.onClick}
                >
                  {option.icon && <option.icon className="size-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{option.label}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
