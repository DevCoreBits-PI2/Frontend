import Sidebar from "@/components/Sidebar";
import FirstLoginGate from "@/components/auth/FirstLoginGate";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { RouteGuard } from "@/lib/auth/RouteGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <RouteGuard>
        <FirstLoginGate>
          <div className="flex min-h-screen bg-[#ECEFF1]">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </FirstLoginGate>
      </RouteGuard>
    </AuthProvider>
  );
}
