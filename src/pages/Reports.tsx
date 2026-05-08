import { useEffect, useState } from "react";
import { FileText, Download, Calendar } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reportsAPI } from "@/lib/api";
import { toast } from "sonner";

type ReportItem = {
  id: string;
  title: string;
  description: string;
  icon: "FileText" | "Calendar";
};

const iconMap = {
  FileText,
  Calendar,
} as const;

export default function Reports() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await reportsAPI.list();
        if (!alive) return;
        setReports((res.data.data ?? []) as ReportItem[]);
      } catch {
        toast.error("رپورٹس لوڈ نہیں ہو سکیں");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const download = async (type: string) => {
    try {
      setDownloading(type);
      const res = await reportsAPI.downloadCsv(type);
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("ڈاؤنلوڈ نہیں ہو سکا");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DashboardLayout title="رپورٹس">
      <PageHeader
        title="رپورٹس"
        description="مختلف رپورٹس ڈاؤنلوڈ کریں"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary">
                  {(() => {
                    const Icon = iconMap[report.icon] ?? FileText;
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{report.description}</p>
              <Button
                variant="outline"
                className="w-full"
                disabled={downloading === report.id}
                onClick={() => download(report.id)}
              >
                <Download className="h-4 w-4 ml-2" />
                {downloading === report.id ? "ڈاؤنلوڈ ہو رہا ہے..." : "ڈاؤنلوڈ کریں"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
