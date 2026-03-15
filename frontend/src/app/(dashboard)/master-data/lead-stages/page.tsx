"use client"

import { MasterCrudPage } from "@/components/masters/MasterCrudPage"
import { leadStagesApi } from "@/lib/api"

const config = {
  title: "Lead Stages",
  description: "New, Contacted, Interested, Demo Scheduled, etc.",
  statusFilterField: "is_closed",
  fields: [
    { key: "id", label: "ID" },
    { key: "name", label: "Name", required: true },
    { key: "slug", label: "Slug", placeholder: "e.g. new, contacted" },
    { key: "stage_order", label: "Order", type: "number" },
    { key: "color", label: "Color", placeholder: "#hex" },
    { key: "is_closed", label: "Closed", type: "checkbox" },
  ],
}

export default function LeadStagesPage() {
  return (
    <MasterCrudPage
      config={config}
      api={{
        list: () => leadStagesApi.list({ per_page: 100 }),
        create: (data) => leadStagesApi.create(data as Parameters<typeof leadStagesApi.create>[0]),
        update: (id, data) => leadStagesApi.update(id, data as Parameters<typeof leadStagesApi.update>[1]),
        delete: (id) => leadStagesApi.delete(id),
      }}
    />
  )
}
