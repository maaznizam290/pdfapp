"use client";

import Link from "next/link";
import Logo from "./logo";

export default function Header() {
  return (
    <header className="z-30 w-full bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Site branding */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/tools"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              All PDF tools
            </Link>
            <Link
              href="/business"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Business
            </Link>
            <Link
              href="/help"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Help
            </Link>
          </nav>

          {/* Empty div to maintain layout balance */}
          <div className="flex items-center space-x-4">
            {/* Auth buttons removed */}
          </div>
        </div>
      </div>
    </header>
  );
}
