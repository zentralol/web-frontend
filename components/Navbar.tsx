"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MapPin,
  Navigation as NavIcon,
  MessageSquare,
  BarChart3,
  Settings,
  LogIn,
  UserPlus,
  Menu,
  X,
} from "lucide-react";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { spaceGrotesk } from "@/app/ui/fonts";
import { isActiveRoute } from "@/lib/navigation";

const tabs = [
  { id: "map", href: "/map", name: "Map", icon: MapPin },
  { id: "routes", href: "/routes", name: "Routes", icon: NavIcon },
  { id: "assistant", href: "/assistant", name: "Assistant", icon: MessageSquare },
  { id: "activity", href: "/activity", name: "Activity", icon: BarChart3 },
];

const tabLinkClass = (isActive: boolean) =>
  `${spaceGrotesk.className} flex items-center gap-3 text-[12px] font-bold uppercase tracking-widest transition-all duration-300 ${
    isActive ? "text-accent" : "text-white/60 hover:text-accent"
  }`;

const desktopTabLinkClass = (isActive: boolean) =>
  `${tabLinkClass(isActive)} shrink-0 border-b-2 pb-1.5 pt-1 ${
    isActive ? "border-accent" : "border-transparent"
  }`;

export default function Navbar() {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;

  const closeMenu = () => setMenuPath(null);
  const toggleMenu = () =>
    setMenuPath((current) => (current === pathname ? null : pathname));

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-surface/80 backdrop-blur-3xl">
      <div className="mx-auto flex max-w-full items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className={`${spaceGrotesk.className} shrink-0 text-xl font-light tracking-[0.15em] text-accent transition-all duration-300 hover:opacity-80 lg:text-[26px] lg:tracking-[0.2em]`}
        >
          zentra
        </Link>

        <nav
          className="hidden items-center gap-6 lg:flex"
          aria-label="Main"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = isActiveRoute(pathname, tab.href);

            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={desktopTabLinkClass(isActive)}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {tab.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                aria-label="Sign In"
                className={`${spaceGrotesk.className} hidden items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-white/60 transition-colors duration-150 hover:text-accent active:scale-95 sm:flex`}
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                aria-label="Sign Up"
                className={`${spaceGrotesk.className} hidden items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-accent transition-colors duration-150 hover:text-white active:scale-95 sm:flex`}
              >
                Sign Up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link
              href="/settings"
              aria-label="Settings"
              className={`${spaceGrotesk.className} hidden items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors duration-150 sm:flex ${
                isActiveRoute(pathname, "/settings")
                  ? "text-accent"
                  : "text-white/60 hover:text-accent"
              }`}
            >
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
              Settings
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </Show>

          <button
            type="button"
            className="ml-1 flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/5 hover:text-accent lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={toggleMenu}
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-[var(--viewport-top)] z-40 bg-black/60 lg:hidden"
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <nav
            id="mobile-nav"
            className="fixed inset-x-0 top-[var(--viewport-top)] z-50 border-b border-white/10 bg-surface px-4 py-4 sm:px-6 lg:hidden"
            aria-label="Main"
          >
            <ul className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = isActiveRoute(pathname, tab.href);

                return (
                  <li key={tab.id}>
                    <Link
                      href={tab.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`${tabLinkClass(isActive)} rounded-xl px-3 py-3 ${
                        isActive ? "bg-accent/10" : "hover:bg-white/5"
                      }`}
                      onClick={closeMenu}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {tab.name}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 border-t border-white/10 pt-4 sm:hidden">
              <Show when="signed-out">
                <div className="flex flex-col gap-1">
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className={`${spaceGrotesk.className} ${tabLinkClass(false)} w-full rounded-xl px-3 py-3 hover:bg-white/5`}
                    >
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      type="button"
                      className={`${spaceGrotesk.className} ${tabLinkClass(false)} w-full rounded-xl px-3 py-3 text-accent hover:bg-white/5`}
                    >
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/settings"
                  className={`${tabLinkClass(isActiveRoute(pathname, "/settings"))} rounded-xl px-3 py-3 hover:bg-white/5 ${
                    isActiveRoute(pathname, "/settings") ? "bg-accent/10" : ""
                  }`}
                  onClick={closeMenu}
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Settings
                </Link>
              </Show>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
