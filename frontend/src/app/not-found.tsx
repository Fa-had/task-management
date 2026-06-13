import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🐜</div>
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl font-semibold mb-2">Page not found</p>
        <p className="text-muted-foreground text-sm mb-8">
          The ants searched everywhere but couldn&apos;t find this page.
        </p>
        <Link
          href="/dashboard"
          className="btn-primary px-6 py-2.5 inline-flex items-center gap-2"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
