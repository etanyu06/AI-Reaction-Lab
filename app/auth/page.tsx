import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">AI Reaction Lab</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to create landing page tests.</p>
        </div>
        <AuthForm />
      </div>
    </main>
  );
}
