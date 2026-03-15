"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { AppHeader } from "./AppHeader"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="min-w-0 flex-1 overflow-auto bg-muted/20 p-3 sm:p-4 md:p-5">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
