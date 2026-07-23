import { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"

export function PageLayout({
  title,
  description,
  headerAction,
  children
}: {
  title: string
  description: string
  headerAction?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>

      <Card>
        <CardContent className="p-0">
          {children}
        </CardContent>
      </Card>
    </div>
  )
}
