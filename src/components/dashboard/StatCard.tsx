import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "secondary" | "success" | "warning";
}

const variantStyles = {
  default: "bg-card",
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
};

export function StatCard({ title, value, icon, trend, variant = "default" }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-all duration-200 hover:shadow-lg", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={cn("text-sm font-medium", variant === "default" ? "text-muted-foreground" : "opacity-90")}>
              {title}
            </p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <p className={cn("text-xs", trend.isPositive ? "text-success" : "text-destructive", variant !== "default" && "opacity-90")}>
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </p>
            )}
          </div>
          <div className={cn("flex items-center justify-center h-12 w-12 rounded-xl", variant === "default" ? "bg-primary/10 text-primary" : "bg-white/20")}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
