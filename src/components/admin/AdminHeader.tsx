"use client";

interface Props {
  title: string;
  action?: React.ReactNode;
}

export default function AdminHeader({ title, action }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-xl font-semibold text-[#1e1e21]">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  );
}
