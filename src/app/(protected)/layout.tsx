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
      <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-4 lg:gap-8 px-3 sm:px-4 py-4 sm:py-6 min-w-0">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <MobileNav />
          <PGSIGuard>{children}</PGSIGuard>
        </main>
      </div>
      <Footer />
    </>
  );
}
