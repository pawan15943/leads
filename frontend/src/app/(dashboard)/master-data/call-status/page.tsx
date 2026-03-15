"use client"

import { MasterCrudPage } from "@/components/masters/MasterCrudPage"
import { callStatusesApi } from "@/lib/api"

const config = {
  title: "Call Status",
  description: "Call Not Received, Not Connected, Interested, Demo Scheduled, etc.",
  statusFilterField: "is_connected",
  fields: [
    { key: "id", label: "ID" },
    { key: "name", label: "Name", required: true },
    { key: "slug", label: "Slug", placeholder: "e.g. call-not-received" },
    { key: "is_connected", label: "Connected", type: "checkbox" as const },
  ],
}

export default function CallStatusPage() {
  return (
    <MasterCrudPage
      config={config}
      api={{
        list: () => callStatusesApi.list({ per_page: 100 }),
        create: (data) => callStatusesApi.create(data as Parameters<typeof callStatusesApi.create>[0]),
        update: (id, data) => callStatusesApi.update(id, data as Parameters<typeof callStatusesApi.update>[1]),
        delete: (id) => callStatusesApi.delete(id),
      }}
    />
  )
}
