"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  PenTool,
  ClipboardList,
  CheckSquare,
  ListTodo,
  FileText,
  Hammer,
  Package,
  Shield,
  Truck,
  Users,
  LogOut,
  History,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type NavItem = { title: string; url: string; icon: LucideIcon }

export function AppSidebar({ role }: { role: string }) {
  const pathname = usePathname()

  let navGroups: { label: string; items: NavItem[] }[] = []

  if (role === "EMPLOYEE") {
    navGroups = [
      {
        label: "My Work",
        items: [
          { title: "Dashboard", url: "/employee", icon: LayoutDashboard },
          { title: "Task History", url: "/employee/history", icon: History },
          { title: "Assignments", url: "/employee/assignments", icon: ClipboardList },
        ],
      },
    ]
  } else if (role === "MANAGER") {
    navGroups = [
      {
        label: "Overview",
        items: [
          { title: "Dashboard", url: "/manager", icon: LayoutDashboard },
        ],
      },
      {
        label: "People",
        items: [
          { title: "Employees", url: "/manager/employees", icon: Users },
        ],
      },
      {
        label: "Service Desk",
        items: [
          { title: "Queries", url: "/manager/queries", icon: LayoutDashboard },
        ],
      },
      {
        label: "Records",
        items: [
          { title: "Quotations", url: "/manager/quotations", icon: FileText },
          { title: "Parts Ordering", url: "/manager/parts", icon: Package },
          { title: "Warranty Exchange", url: "/manager/warranty", icon: Shield },
          { title: "Internal Repair", url: "/manager/repairs", icon: Hammer },
        ],
      },
      {
        label: "Accounting",
        items: [
          { title: "Sales", url: "/manager/sales", icon: FileText },
          { title: "Purchases", url: "/manager/purchases", icon: FileText },
          { title: "Repairs", url: "/manager/acc-repairs", icon: Hammer },
          { title: "Replacements", url: "/manager/replacements", icon: Package },
        ],
      },
    ]
  } else if (role === "COORDINATOR") {
    navGroups = [
      {
        label: "Service Desk",
        items: [
          { title: "Queries", url: "/coordinator", icon: LayoutDashboard },
        ],
      },
      {
        label: "Records",
        items: [
          { title: "Quotations", url: "/coordinator/quotations", icon: FileText },
          { title: "Parts Ordering", url: "/coordinator/parts", icon: Package },
          { title: "Warranty Exchange", url: "/coordinator/warranty", icon: Shield },
          { title: "Internal Repair", url: "/coordinator/repairs", icon: Hammer },
        ],
      },
    ]
  } else if (role === "DIRECTOR") {
    navGroups = [
      {
        label: "Overview",
        items: [
          { title: "Dashboard", url: "/director", icon: LayoutDashboard },
        ],
      },
      {
        label: "People",
        items: [
          { title: "Employees", url: "/director/employees", icon: Users },
        ],
      },
      {
        label: "Service Desk",
        items: [
          { title: "Queries", url: "/director/queries", icon: LayoutDashboard },
        ],
      },
      {
        label: "Records",
        items: [
          { title: "Quotations", url: "/director/quotations", icon: FileText },
          { title: "Parts Ordering", url: "/director/parts", icon: Package },
          { title: "Warranty Exchange", url: "/director/warranty", icon: Shield },
          { title: "Internal Repair", url: "/director/repairs", icon: Hammer },
        ],
      },
      {
        label: "Accounting",
        items: [
          { title: "Sales", url: "/director/sales", icon: FileText },
          { title: "Purchases", url: "/director/purchases", icon: FileText },
          { title: "Repairs", url: "/director/acc-repairs", icon: Hammer },
          { title: "Replacements", url: "/director/replacements", icon: Package },
        ],
      },
    ]
  } else if (role === "ACCOUNTANT") {
    navGroups = [
      {
        label: "My Work",
        items: [
          { title: "Dashboard", url: "/accountant", icon: LayoutDashboard },
          { title: "Task History", url: "/accountant/history", icon: History },
        ],
      },
      {
        label: "Accounting",
        items: [
          { title: "Sales", url: "/accountant/sales", icon: FileText },
          { title: "Purchases", url: "/accountant/purchases", icon: FileText },
          { title: "Repairs", url: "/accountant/repairs", icon: Hammer },
          { title: "Replacements", url: "/accountant/replacements", icon: Package },
        ],
      },
    ]
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h2 className="text-xl font-bold tracking-tight">TaskLogger</h2>
        <p className="text-xs text-muted-foreground uppercase">{role}</p>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton render={<Link href={item.url} />} isActive={pathname === item.url || pathname.startsWith(item.url + "/")}>
                      <item.icon className="mr-2" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <div className="mt-auto p-4 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/signout" className="text-red-500 hover:text-red-600" />}>
              <LogOut className="mr-2" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </Sidebar>
  )
}
