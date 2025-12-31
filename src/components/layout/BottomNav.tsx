"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, BookOpen, MessageCircle, User, LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  isSpecial?: boolean;
  hasBadge?: boolean;
}

const navItems: NavItem[] = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/study", icon: BookOpen, label: "Study" },
  { href: "/generate", icon: Sparkles, label: "Create", isSpecial: true },
  { href: "/messages", icon: MessageCircle, label: "Messages", hasBadge: true },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch("/api/conversations");
        const data = await res.json();
        const total = data.conversations?.reduce(
          (sum: number, conv: { unreadCount: number }) => sum + conv.unreadCount,
          0
        ) || 0;
        setUnreadMessages(total);
      } catch (error) {
        // Silently fail - user might not be logged in
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-t border-white/10 safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center w-16 h-full"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full transition-colors relative ${
                isActive ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {item.hasBadge && unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
