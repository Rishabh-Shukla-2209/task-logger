"use client"

import { useState, useEffect } from "react"
import { fetchGlobalProgress } from "@/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Activity, Wrench, Package, FileText } from "lucide-react"

export function GlobalProgressDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGlobalProgress().then(res => {
      setData(res)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return <div className="text-destructive">Failed to load dashboard data.</div>

  const modules = [
    { 
      title: "Active Queries", 
      icon: Activity,
      count: data.queries.total, 
      items: data.queries.data,
      color: "text-blue-500",
      bg: "bg-blue-50",
      basePath: "/coordinator/queries"
    },
    { 
      title: "Pending Quotations", 
      icon: FileText,
      count: data.quotations.total, 
      items: data.quotations.data,
      color: "text-amber-500",
      bg: "bg-amber-50",
      basePath: "/coordinator/quotations"
    },
    { 
      title: "In-Progress Repairs", 
      icon: Wrench,
      count: data.repairs.total, 
      items: data.repairs.data,
      color: "text-rose-500",
      bg: "bg-rose-50",
      basePath: "/coordinator/repairs"
    },
    { 
      title: "Active Part Requests", 
      icon: Package,
      count: data.parts.total, 
      items: data.parts.data,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      basePath: "/coordinator/parts"
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((mod) => (
          <Card key={mod.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{mod.title}</CardTitle>
              <mod.icon className={`h-4 w-4 ${mod.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mod.count}</div>
              <p className="text-xs text-muted-foreground mt-1">Requiring action</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modules.map((mod) => (
          <Card key={mod.title + "-list"} className="flex flex-col">
            <CardHeader className={mod.bg + " rounded-t-lg border-b"}>
              <div className="flex items-center gap-2">
                <mod.icon className={`h-5 w-5 ${mod.color}`} />
                <CardTitle className="text-lg">{mod.title}</CardTitle>
              </div>
              <CardDescription>Recent {mod.items.length} items</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {mod.items.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">All caught up!</div>
              ) : (
                <div className="divide-y">
                  {mod.items.map((item: any) => (
                    <a href={`${mod.basePath}/${item.id}`} key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors block w-full text-left">
                      <div className="space-y-1">
                        <p className="font-medium text-indigo-700 hover:underline">
                          {item.customer_name || item.item_description || item.part_name}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {item.device_details || item.description || item.for_whom || item.sent_to}
                        </p>
                      </div>
                      <Badge variant="outline">{item.status}</Badge>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
