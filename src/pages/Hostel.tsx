import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Home,
  DoorOpen, 
  Users, 
  BedDouble, 
  Wallet,
  Receipt
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Hostel() {
  const navigate = useNavigate();

  const dashboardItems = [
    {
      title: "ڈیش بورڈ",
      icon: LayoutDashboard,
      description: "ہاسٹل کا عمومی نظارہ",
      color: "bg-emerald-800",
      path: "/hostel/dashboard",
    },
    {
      title: "ہاسٹل",
      icon: Home,
      description: "ہاسٹل کی تفصیلات اور معلومات",
      color: "bg-emerald-800",
      path: "/hostel/info",
    },
    {
      title: "کمرے",
      icon: DoorOpen,
      description: "کمروں کی فہرست اور انتظام",
      color: "bg-emerald-800",
      path: "/hostel/rooms",
    },
    {
      title: "ریذیڈنٹس",
      icon: Users,
      description: "مقیم طلباء کی تفصیلات",
      color: "bg-emerald-800",
      path: "/hostel/residents",
    },
    {
      title: "بیڈ الوکیشن",
      icon: BedDouble,
      description: "بیڈز کی تخصیص اور انتظام",
      color: "bg-emerald-800",
      path: "/hostel/beds",
    },
  ];

  return (
    <DashboardLayout title="ہاسٹل">
      <PageHeader
        title="ہاسٹل مینجمنٹ"
        description="ہاسٹل کے تمام اختیارات یہاں سے منتخب کریں"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {dashboardItems.map((item, index) => (
          <Card 
            key={index} 
            onClick={() => navigate(item.path)}
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
          >
            <CardHeader className="pb-3">
              <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
