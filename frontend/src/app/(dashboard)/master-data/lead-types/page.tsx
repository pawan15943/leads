import { MasterCrudPage } from "@/components/masters/MasterCrudPage"

const config = {
  title: "Lead Types",
  description: "Lead type categories",
  fields: [
    { key: "id", label: "ID" },
    { key: "name", label: "Name", required: true },
    { key: "description", label: "Description", placeholder: "Optional description" },
  ],
}

const initialData = [
  { id: 1, name: "Library", description: "Library management" },
  { id: 2, name: "Academy", description: "Educational institution" },
]

export default function LeadTypesPage() {
  return <MasterCrudPage config={config} initialData={initialData} />
}
