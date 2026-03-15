import { redirect } from "next/navigation"

export default function TodayFollowUpsPage() {
  redirect("/leads?view=follow-ups")
}
