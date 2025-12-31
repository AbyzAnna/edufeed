import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="md:pt-16 pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
