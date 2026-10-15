export function WorkspaceSwitcher({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
      <span className="font-medium">{name}</span>
    </div>
  );
}
