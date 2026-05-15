import { useEffect, useMemo, useState } from "react";
import { Users, UserPlus, Clock, CheckCircle, XCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { statsAPI } from "@/lib/api";

type DashboardStatsResponse = {
  overview: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  };
  classDistribution: Array<{ _id: string; count: number }>;
  recentStudents: Array<{
    _id: string;
    tokenNumber: string;
    studentName: string;
    fatherName: string;
    class: string;
    status: string;
    createdAt: string;
  }>;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardStatsResponse | null>(null);

  const fetchData = async () => {
    try {
      const res = await statsAPI.getDashboard();
      setData(res.data.data as DashboardStatsResponse);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    fetchData();
    const interval = setInterval(() => {
      if (alive) fetchData();
    }, 5000); // Refresh every 5 seconds
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  const totalStudents = data?.overview.total ?? 0;
  const pendingCount = data?.overview.pending ?? 0;
  const verifiedCount = data?.overview.verified ?? 0;
  const rejectedCount = data?.overview.rejected ?? 0;

  const topClasses = useMemo(() => {
    return (data?.classDistribution ?? []).slice(0, 5);
  }, [data]);

  const recentActivity = useMemo(() => {
    return (data?.recentStudents ?? []).slice(0, 5);
  }, [data]);

  // Safe date formatting helper
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "—";
      return date.toLocaleDateString("ur-PK");
    } catch (e) {
      return "—";
    }
  };

  return (
    <DashboardLayout title="ڈیش بورڈ">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="کل درخواستیں"
          value={loading ? "..." : totalStudents}
          icon={<Users className="h-6 w-6" />}
          variant="primary"
        />
        <StatCard
          title="زیر التوا"
          value={loading ? "..." : pendingCount}
          icon={<Clock className="h-6 w-6" />}
          variant="warning"
        />
        <StatCard
          title="منظور شدہ"
          value={loading ? "..." : verifiedCount}
          icon={<CheckCircle className="h-6 w-6" />}
          variant="success"
        />
        <StatCard
          title="مسترد شدہ"
          value={loading ? "..." : rejectedCount}
          icon={<XCircle className="h-6 w-6" />}
          trend={
            rejectedCount > 0
              ? { value: `${rejectedCount} مسترد`, isPositive: false }
              : undefined
          }
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>حیثیت کی تفصیل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="font-medium">زیر التوا</span>
                </div>
                <span className="text-2xl font-bold">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-medium">منظور شدہ</span>
                </div>
                <span className="text-2xl font-bold">{verifiedCount}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="font-medium">مسترد شدہ</span>
                </div>
                <span className="text-2xl font-bold">{rejectedCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Class Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>درجہ کی تقسیم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topClasses.map(({ _id, count }) => (
                  <div
                    key={_id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <span className="font-medium">{_id}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${totalStudents ? (count / totalStudents) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">حالیہ درخواستیں</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">ٹوکن نمبر</TableHead>
                <TableHead className="text-right">نام</TableHead>
                <TableHead className="text-right">والد کا نام</TableHead>
                <TableHead className="text-right">درجہ</TableHead>
                <TableHead className="text-right">تاریخ اجراء</TableHead>
                <TableHead className="text-right">حیثیت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((token) => (
                <TableRow key={token._id}>
                  <TableCell className="font-mono font-medium text-primary">
                    {token.tokenNumber}
                  </TableCell>
                  <TableCell className="font-medium">
                    {token.studentName}
                  </TableCell>
                  <TableCell>{token.fatherName}</TableCell>
                  <TableCell>{token.class}</TableCell>
                  <TableCell>
                    {formatDate(token.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={token.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
