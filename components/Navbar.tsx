"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/map", label: "Map" },
  { href: "/routes", label: "Routes" },
  { href: "/assistant", label: "Assistant" },
  { href: "/activity", label: "Activity" },
];
export default function Navbar() {
  const pathName = usePathname();
  return (
    <nav className="flex gap-6 p-4 border-b">
      {links.map((link) => {
        const isActive = pathName === link.href;
        return (
          <Link key={link.href} href={link.href} className={isActive ? "font-bold text-blue-600" : "text-grey-600"}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
