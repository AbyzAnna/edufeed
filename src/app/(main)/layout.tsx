import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import GlobalMusicPlayer from "@/components/music/GlobalMusicPlayer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-0 pb-20 md:pt-16 md:pb-0">{children}</main>
      <BottomNav />
      <GlobalMusicPlayer />
    </div>
  );
}
