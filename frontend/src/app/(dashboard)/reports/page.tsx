import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold sm:text-xl">Reports</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">Lead Source Performance, BD Call Activity, Conversion Rate, Daily Call Count, Lead Funnel</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead Source Performance</CardTitle>
            <CardDescription>Performance by source</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2">Connect to API.</p>
            <Button variant="outline" size="sm"><FileDown className="mr-2 size-4" />Export CSV</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>BD Call Activity</CardTitle>
            <CardDescription>Call activity by BD user</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2">Connect to API.</p>
            <Button variant="outline" size="sm"><FileDown className="mr-2 size-4" />Export Excel</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
            <CardDescription>Lead conversion funnel</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2">Connect to API.</p>
            <Button variant="outline" size="sm"><FileDown className="mr-2 size-4" />Export</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Daily Call Count</CardTitle>
            <CardDescription>Daily calls graph</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2">Connect to API.</p>
            <Button variant="outline" size="sm"><FileDown className="mr-2 size-4" />Export</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lead Funnel</CardTitle>
            <CardDescription>Stage-wise lead distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2">Connect to API.</p>
            <Button variant="outline" size="sm"><FileDown className="mr-2 size-4" />Export CSV</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
