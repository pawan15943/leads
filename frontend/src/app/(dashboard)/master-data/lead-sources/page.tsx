"use client"

import { MasterCrudPage } from "@/components/masters/MasterCrudPage"
import { leadSourcesApi } from "@/lib/api"

const config = {
  title: "Lead Sources",
  description: "Website, Referral, etc.",
  statusFilterField: "status",
  fields: [
    { key: "id", label: "ID" },
    { key: "name", label: "Name", required: true },
    { key: "slug", label: "Slug", placeholder: "e.g. website, referral" },
    { key: "status", label: "Status", placeholder: "active / inactive" },
  ],
}

export default function LeadSourcesPage() {
  return (
    <MasterCrudPage
      config={config}
      api={{
        list: () => leadSourcesApi.list({ per_page: 100 }),
        create: (data) => leadSourcesApi.create(data as Parameters<typeof leadSourcesApi.create>[0]),
        update: (id, data) => leadSourcesApi.update(id, data as Parameters<typeof leadSourcesApi.update>[1]),
        delete: (id) => leadSourcesApi.delete(id),
      }}
    />
  )
}
