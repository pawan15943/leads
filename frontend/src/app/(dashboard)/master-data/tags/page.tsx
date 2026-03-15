"use client"

import { MasterCrudPage } from "@/components/masters/MasterCrudPage"
import { tagsApi } from "@/lib/api"

const config = {
  title: "Tags",
  description: "Lead tags for categorization",
  fields: [
    { key: "id", label: "ID" },
    { key: "name", label: "Name", required: true },
    { key: "color", label: "Color", placeholder: "#hex" },
  ],
}

export default function TagsPage() {
  return (
    <MasterCrudPage
      config={config}
      api={{
        list: () => tagsApi.list({ per_page: 100 }),
        create: (data) => tagsApi.create(data as Parameters<typeof tagsApi.create>[0]),
        update: (id, data) => tagsApi.update(id, data as Parameters<typeof tagsApi.update>[1]),
        delete: (id) => tagsApi.delete(id),
      }}
    />
  )
}
