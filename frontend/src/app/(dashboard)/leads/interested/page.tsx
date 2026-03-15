import { redirect } from "next/navigation"

export default function InterestedLeadsPage() {
  redirect("/leads?view=interested")
}
