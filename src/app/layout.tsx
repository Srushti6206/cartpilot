import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ShopShell } from "@/components/shop-shell";
import { StoreProvider } from "@/components/store-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CartPilot | Find your kind of thing",
  description:
    "A more thoughtful way to discover, compare, and choose. Browse CartPilot's illustrative sample catalog.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body>
        <StoreProvider>
          <ShopShell>{children}</ShopShell>
        </StoreProvider>
      </body>
    </html>
  );
}
