type StatCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{helper}</p>
    </div>
  );
}
