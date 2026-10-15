import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
      {action ? (
        <Button asChild className="mt-5">
          <a href={action.href}>{action.label}</a>
        </Button>
      ) : null}
    </div>
  );
}
