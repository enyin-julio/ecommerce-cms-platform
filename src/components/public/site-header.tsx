import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-ink">
          Commerce Studio
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-muted">
          <Link className="hover:text-ink" href="/about">
            Brand
          </Link>
          <Link className="hover:text-ink" href="/products">
            Products
          </Link>
          <Link className="hover:text-ink" href="/cart">
            Cart
          </Link>
          <Link className="hover:text-ink" href="/account">
            Account
          </Link>
          <Link className="hover:text-ink" href="/login">
            Login
          </Link>
          <Link
            className="rounded-full bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
            href="/admin"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
