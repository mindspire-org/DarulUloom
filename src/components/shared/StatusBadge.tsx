import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  verified: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  active: "فعال",
  pending: "زیر التوا",
  approved: "منظور شدہ",
  verified: "تصدیق شدہ",
  rejected: "مسترد",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border",
        statusStyles[status] || "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}
