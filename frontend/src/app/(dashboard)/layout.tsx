import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { ListsProvider } from "@/contexts/ListsContext"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ProtectedRoute>
        <ListsProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </ListsProvider>
      </ProtectedRoute>
    </ErrorBoundary>
  )
}
