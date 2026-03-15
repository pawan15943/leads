"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  UserCog,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  Bell,
  Database,
  Settings,
  FileStack,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

type NavItem = { href: string; label: string; icon?: React.ComponentType<{ className?: string }> }
type NavSection = { label: string; icon: React.ComponentType<{ className?: string }>; items: NavItem[] }

const adminParentItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
]

const bdParentItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
]

const leadsSectionAdmin: NavSection = {
  label: "Leads",
  icon: ClipboardList,
  items: [
    { href: "/leads", label: "All Leads" },
    { href: "/import", label: "Import Leads" },
    { href: "/tasks", label: "Tasks" },
    { href: "/reminders", label: "Reminder" },
  ],
}

const leadsSectionBd: NavSection = {
  label: "Leads",
  icon: ClipboardList,
  items: [
    { href: "/leads", label: "All Leads" },
    { href: "/import", label: "Import Leads" },
    { href: "/tasks", label: "Tasks" },
    { href: "/reminders", label: "Reminder" },
  ],
}

const adminSections: NavSection[] = [
  leadsSectionAdmin,
  { label: "Reports", icon: BarChart3, items: [{ href: "/reports", label: "Reports" }] },
  { label: "User Management", icon: UserCog, items: [
    { href: "/users", label: "Users" },
    { href: "/roles", label: "Roles" },
    { href: "/permissions", label: "Permissions" },
  ]},
  { label: "Master Data", icon: Database, items: [
    { href: "/master-data/lead-sources", label: "Source" },
    { href: "/master-data/lead-stages", label: "Stages" },
    { href: "/master-data/tags", label: "Tags" },
    { href: "/master-data/lead-types", label: "Lead Types" },
    { href: "/master-data/call-status", label: "Call Status" },
    { href: "/master-data/countries", label: "Countries" },
    { href: "/master-data/states", label: "States" },
    { href: "/master-data/cities", label: "Cities" },
  ]},
  { label: "Settings", icon: Settings, items: [{ href: "/settings", label: "Settings" }] },
]

const bdSections: NavSection[] = [
  leadsSectionBd,
  { label: "Settings", icon: Settings, items: [{ href: "/settings", label: "Settings" }] },
]

function SidebarNavSection({ section, pathname }: { section: NavSection; pathname: string }) {
  const hasActiveChild = section.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  )
  const [open, setOpen] = useState(hasActiveChild)
  const Icon = section.icon
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md p-2 text-sm font-medium transition-colors",
              "text-foreground hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              hasActiveChild && "bg-muted/40"
            )}
            title={section.label}
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right" className="w-48">
          {section.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <DropdownMenuItem key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex cursor-pointer items-center",
                    isActive && "font-medium bg-accent"
                  )}
                >
                  {item.label}
                </Link>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors",
          "text-foreground hover:bg-muted/50",
          hasActiveChild && "bg-muted/40"
        )}
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60">
          <Icon className="size-3.5 text-muted-foreground" />
        </div>
        <span className="flex-1 text-left">{section.label}</span>
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/40 pl-3">
          {section.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-2 py-1.5 text-sm transition-colors",
                  isActive
                    ? "font-medium text-foreground bg-muted/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const { user, isAdmin, logout } = useAuth()
  const parentItems = isAdmin ? adminParentItems : bdParentItems
  const sections = isAdmin ? adminSections : bdSections

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 [&_[data-slot=sidebar-inner]]:bg-transparent">
      <SidebarRail />
      <SidebarHeader className="px-2 py-2">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
            <FileStack className="size-4" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-foreground">Lead Management</p>
            <p className="truncate text-xs text-muted-foreground">CRM</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0 px-2 py-2 group-data-[collapsible=icon]:!overflow-y-auto">
        <div className="mb-2 px-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/80 group-data-[collapsible=icon]:hidden">
          Platform
        </div>
        <SidebarMenu className="space-y-0.5">
          {parentItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  tooltip={item.label}
                  isActive={isActive}
                  render={
                    <Link href={item.href} className="flex items-center gap-2">
                      {Icon && (
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:size-4">
                          <Icon className="size-3.5 text-muted-foreground group-data-[collapsible=icon]:size-4" />
                        </div>
                      )}
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
        <div className="mt-2 space-y-0.5 group-data-[collapsible=icon]:mt-1">
          {sections.map((section) => (
            <SidebarNavSection key={section.label} section={section} pathname={pathname} />
          ))}
        </div>
      </SidebarContent>
      <div className="mt-auto border-t border-border/40 px-2 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/50 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2"
          >
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium text-foreground">{user?.name || "User"}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-56">
            <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Sidebar>
  )
}
