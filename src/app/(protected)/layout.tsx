import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Sidebar, { MobileNav } from "@/components/Sidebar";
import PGSIGuard from "@/components/PGSIGuard";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full flex gap-8">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <MobileNav />
          <PGSIGuard>{children}</PGSIGuard>
        </main>
      </div>
      <Footer />
    </>
  );
}
