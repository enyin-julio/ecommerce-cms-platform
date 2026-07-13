import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-ink">
          AIH 品牌商城
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-muted">
          <Link className="hover:text-ink" href="/about">
            品牌介紹
          </Link>
          <Link className="hover:text-ink" href="/products">
            商品
          </Link>
          <Link className="hover:text-ink" href="/cart">
            購物車
          </Link>
          <Link className="hover:text-ink" href="/account">
            會員中心
          </Link>
          <Link className="hover:text-ink" href="/login">
            登入
          </Link>
          <Link
            className="rounded-full bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
            href="/admin"
          >
            後台
          </Link>
        </nav>
      </div>
    </header>
  );
}
