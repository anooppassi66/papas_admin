interface Props { active: boolean; }

export default function StatusBadge({ active }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
      active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
    }`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}
