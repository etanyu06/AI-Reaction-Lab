type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
