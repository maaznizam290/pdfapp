"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import Footer from "@/components/ui/footer";
import HydrationBoundary from "@/components/hydration-boundary";

// Import AOS CSS
import "aos/dist/aos.css";

// Dynamically import AOS to prevent hydration issues
const AOS = dynamic(() => import("aos"), { ssr: false });

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Initialize AOS only on client side
    if (typeof window !== 'undefined') {
      import("aos").then((AOS) => {
        AOS.default.init({
          once: true,
          disable: "phone",
          duration: 600,
          easing: "ease-out-sine",
        });
      });
    }
  }, []);

  return (
    <HydrationBoundary>
      <main className="relative flex grow flex-col">{children}</main>
      <Footer />
    </HydrationBoundary>
  );
}
