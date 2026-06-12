// Next.js 16: page props (params, searchParams) are async Promises.
// Even if unused, the signature must match Next.js's generated types.
// Run `npx next typegen` to auto-generate PageProps types.
import type { Metadata } from "next";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard — task_management",
};

// Next.js 16: params / searchParams are Promises — always await them.
interface PageProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[]>>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  // Await searchParams before reading (Next.js 16 requirement)
  const resolvedParams = await searchParams;

  // Initial filters can be seeded from URL params (e.g. shared links)
  const initialPage = Number(resolvedParams.page) || 1;
  const initialSearch = (resolvedParams.search as string) || "";

  return (
    <DashboardClient initialPage={initialPage} initialSearch={initialSearch} />
  );
}
