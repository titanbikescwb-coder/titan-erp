import * as React from "react";
import { cn } from "../../lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader = ({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
        className
      )}
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1 text-sm text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};

export { PageHeader };