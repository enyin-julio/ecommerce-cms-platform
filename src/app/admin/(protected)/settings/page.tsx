import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "網站設定"
};

export default function AdminSettingsPage() {
  return (
    <section className="rounded-lg border border-line bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-ink">網站設定</h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        SiteSetting 資料表已建立，可用來保存站名、Logo、主色、SEO 標題與 SEO 描述。
        設定表單會在後續階段補上。
      </p>
    </section>
  );
}
