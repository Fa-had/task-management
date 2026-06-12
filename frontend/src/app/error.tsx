"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // TODO: send to error tracking (e.g. Sentry)
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="text-6xl mb-4">🐜</div>
        <h1 className="text-2xl font-bold mb-2">The colony ran into trouble</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Something unexpected happened. The ants are working on it.
          {error.digest && (
            <span className="block mt-1 text-xs font-mono opacity-60">
              Error ID: {error.digest}
            </span>
          )}
        </p>
        <button
          onClick={reset}
          className="btn-primary px-6 py-2.5"
        >
          Try again
        </button>
      </motion.div>
    </div>
  );
}
