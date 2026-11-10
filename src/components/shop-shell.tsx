"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  CircleUserRound,
  GitCompareArrows,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/components/store-provider";

const navigation = [
  { href: "/", label: "Discover" },
  { href: "/workspace", label: "AI workspace", icon: Sparkles },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/orders", label: "Orders" },
];

export function ShopShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { cartCount, comparedProductIds, storageWarning } = useStore();

  return (
    <div className="app-frame">
      <div className="sample-banner">
        <span className="sample-dot" />
        <span>
          <strong>Sample catalog</strong>
          <span className="banner-divider">/</span>
          Illustrative products &amp; prices — not live merchant listings
        </span>
        <span className="sample-banner-right">Demo experience · integrations coming soon</span>
      </div>

      <header className="store-header">
        <div className="store-header-inner">
          <Link className="store-brand" href="/" aria-label="CartPilot Discover">
            <span className="store-brand-mark">
              <Bot size={19} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <span>cartpilot<span className="brand-period">.</span></span>
          </Link>

          <nav className="store-nav" aria-label="Main navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              const count =
                item.href === "/compare" ? comparedProductIds.length : 0;
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`store-nav-link${active ? " is-active" : ""}`}
                  href={item.href}
                  key={item.href}
                >
                  {Icon && <Icon size={15} strokeWidth={1.9} aria-hidden="true" />}
                  {item.label}
                  {count > 0 && <span className="nav-count">{count}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="store-header-actions">
            <Link aria-label="Compare products" className="header-icon-button" href="/compare" title="Compare products">
              <GitCompareArrows size={18} strokeWidth={1.8} aria-hidden="true" />
            </Link>
            <Link aria-label={`Cart, ${cartCount} items`} className="header-icon-button cart-header-button" href="/cart">
              <ShoppingBag size={18} strokeWidth={1.8} aria-hidden="true" />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </Link>
            <span className="header-divider" />
            <span className="profile-dot" aria-label="Guest shopper">
              <CircleUserRound size={20} strokeWidth={1.65} aria-hidden="true" />
            </span>
          </div>

          <Link aria-label="Open shopping bag" className="mobile-cart" href="/cart">
            <ShoppingBag size={19} aria-hidden="true" />
            {cartCount > 0 && <span>{cartCount}</span>}
          </Link>
        </div>
      </header>

      {storageWarning && <p className="storage-warning" role="status">{storageWarning}</p>}
      <main className="store-main">{children}</main>

      <footer className="store-footer">
        <Link className="footer-brand" href="/">
          cartpilot<span className="brand-period">.</span>
        </Link>
        <span>Thoughtful discovery, with room to decide.</span>
        <span className="footer-sample">Demo experience · sample catalog</span>
      </footer>

      <nav className="mobile-tab-bar" aria-label="Mobile navigation">
        <Link className={pathname === "/" ? "mobile-tab is-active" : "mobile-tab"} href="/">
          <Search size={18} aria-hidden="true" /><span>Discover</span>
        </Link>
        <Link className={pathname.startsWith("/workspace") ? "mobile-tab is-active" : "mobile-tab"} href="/workspace">
          <Sparkles size={18} aria-hidden="true" /><span>AI space</span>
        </Link>
        <Link className={pathname.startsWith("/compare") ? "mobile-tab is-active" : "mobile-tab"} href="/compare">
          <GitCompareArrows size={18} aria-hidden="true" /><span>Compare</span>
        </Link>
        <Link className={pathname.startsWith("/orders") ? "mobile-tab is-active" : "mobile-tab"} href="/orders">
          <Menu size={18} aria-hidden="true" /><span>Orders</span>
        </Link>
      </nav>
    </div>
  );
}
