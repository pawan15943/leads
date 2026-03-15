import { redirect } from "next/navigation"

export default function UnassignedLeadsPage() {
  redirect("/leads?view=unassigned")
}
