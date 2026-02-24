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
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 lg:gap-8 px-4 sm:px-6 py-4 sm:py-6 min-w-0 overflow-x-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 w-full overflow-x-hidden">
          <MobileNav />
          <div className="pt-2 sm:pt-4">
            <PGSIGuard>{children}</PGSIGuard>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
