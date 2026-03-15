import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, ArrowRight } from "lucide-react"

const masters = [
  { href: "/master-data/lead-stages", title: "Lead Stages", description: "New, Contacted, Interested, Demo Scheduled, etc." },
  { href: "/master-data/lead-sources", title: "Lead Sources", description: "Website, Referral, etc." },
  { href: "/master-data/lead-types", title: "Lead Types", description: "Lead type categories" },
  { href: "/master-data/call-status", title: "Call Status", description: "Call Not Received, Connected, Interested, Demo Scheduled, etc." },
  { href: "/master-data/tags", title: "Tags", description: "Lead tags for categorization" },
  { href: "/master-data/countries", title: "Countries", description: "Countries for lead location" },
  { href: "/master-data/states", title: "States", description: "States/provinces for lead location" },
  { href: "/master-data/cities", title: "Cities", description: "Cities for lead location" },
]

export default function MasterDataPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Master Data</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Manage lead stages, sources, types, call status, tags (Admin only)
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {masters.map((m) => (
          <Link key={m.href} href={m.href}>
            <Card className="card-premium overflow-hidden transition-shadow hover:shadow-md dark:border-white/5 h-full hover:border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Database className="size-4 text-muted-foreground" />
                    {m.title}
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription className="text-sm">{m.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full">
                  Manage
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
