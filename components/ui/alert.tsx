import * as React from "react";
import { cn } from "@/lib/utils";

export function Alert({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      className={cn("rounded-md border bg-secondary p-4 text-sm", className)}
      {...props}
    />
  );
}
