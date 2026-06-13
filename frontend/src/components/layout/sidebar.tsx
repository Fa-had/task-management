"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, CheckSquare, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tasks", label: "All Tasks", icon: CheckSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout, isLoggingOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 glass-card border-r z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 pb-5">
          <span className="text-2xl select-none">🐜</span>
          <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AntFlow
          </span>
        </div>

        <Separator className="mx-4 w-auto" />

        {/* Nav links */}
        <nav className="flex-1 p-4 space-y-1 mt-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}>
                <motion.div
                  whileHover={{ x: 3 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary dark:text-primary-400"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                  {active && (
                    <motion.div
                      layoutId="active-pill"
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="p-4 space-y-2">
          <Separator className="mb-3" />

          {/* Theme toggle */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={toggleTheme}
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {mounted
              ? theme === "dark"
                ? "Light mode"
                : "Dark mode"
              : "Dark mode"}
          </Button>

          {/* User row */}
          {user && (
            <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs">
                  {user.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-danger flex-shrink-0"
                    onClick={() => logout()}
                    disabled={isLoggingOut}
                    aria-label="Log out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Log out</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 glass-card border-b z-30 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl select-none">🐜</span>
          <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AntFlow
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>
    </>
  );
}
