import * as React from "react";
import { cn } from "../../lib/utils";

interface PageContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const PageContainer = ({
  className,
  children,
  ...props
}: PageContainerProps) => {
  return (
    <div
      className={cn(
        "min-h-screen bg-[#0A0A0A] text-white p-6",
        className
      )}
      {...props}
    >
      <div className="mx-auto w-full space-y-6">
        {children}
      </div>
    </div>
  );
};

export { PageContainer };