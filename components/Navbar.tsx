"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  Navigation as NavIcon,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { spaceGrotesk } from "@/app/ui/fonts";

const tabs = [
  { id: "map", href: "/map", name: "Map", icon: MapPin },
  { id: "routes", href: "/routes", name: "Routes", icon: NavIcon },
  { id: "assistant", href: "/assistant", name: "Assistant", icon: MessageSquare },
  { id: "activity", href: "/activity", name: "Activity", icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-[#121314]/80 backdrop-blur-3xl">
      <div className="mx-auto flex max-w-full items-center justify-between px-6 py-4">
        <div className="flex min-w-0 items-center gap-6 md:gap-10">
          <Link
            href="/"
            className={`${spaceGrotesk.className} shrink-0 text-[26px] font-light tracking-[0.2em] text-[#ffdca1] transition-all duration-300 hover:opacity-80`}
          >
            zentra
          </Link>

          <nav
            className="flex items-center gap-4 overflow-x-auto md:gap-6"
            aria-label="Main"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`${spaceGrotesk.className} relative flex shrink-0 items-center gap-1.5 border-b-2 pb-1.5 pt-1 text-[12px] font-bold uppercase tracking-widest transition-all duration-300 ${
                    isActive
                      ? "border-[#ffdca1] text-[#ffdca1]"
                      : "border-transparent text-white/60 hover:text-[#ffdca1]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {tab.name}
                  {isActive && (
                    <span className="absolute bottom-[-2px] left-0 h-[2px] w-full animate-pulse bg-[#ffdca1]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className={`${spaceGrotesk.className} px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-white/60 transition-colors duration-150 hover:text-[#ffdca1] active:scale-95`}
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className={`${spaceGrotesk.className} px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-[#ffdca1] transition-colors duration-150 hover:text-white active:scale-95`}
              >
                Sign Up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </Show>
        </div>
      </div>
    </header>
  );
}
