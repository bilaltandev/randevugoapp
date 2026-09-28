"use client";

import React, { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";

interface DashboardShellProps {
  business: any;
  user: any;
  subscriptionStatus: string;
  children: React.ReactNode;
}

export function DashboardShell({
  business,
  user,
  subscriptionStatus,
  children,
}: DashboardShellProps) {
  // Default is "light" as requested by user
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("randevugo_dash_theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("randevugo_dash_theme", nextTheme);
  };

  return (
    <div
      className={`flex h-screen overflow-hidden ${
        theme === "dark" ? "dash-theme-dark dark" : "dash-theme-light"
      }`}
    >
      {/* Dark Sidebar is always preserved */}
      <DashboardSidebar
        business={business}
        subscriptionStatus={subscriptionStatus}
        userRole={user.role}
      />

      {/* Main Content Area: Default light #F6F7FB, dark fallback #080C10 */}
      <div className="flex flex-1 flex-col overflow-hidden dash-main-area bg-[#F6F7FB] dark:bg-[#080C10] text-[#111827] dark:text-[#F1F5F9] transition-colors duration-200">
        <DashboardHeader
          business={business}
          user={user}
          subscriptionStatus={subscriptionStatus}
          currentTheme={theme}
          onToggleTheme={handleToggleTheme}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 dash-content-scroll">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
