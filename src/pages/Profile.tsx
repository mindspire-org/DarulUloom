import { useEffect, useState } from "react";
import { User, Shield } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usersAPI } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PasswordInput } from "@/components/shared/PasswordInput";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    username: user?.username ?? "",
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    setProfile({
      name: user?.name ?? "",
      username: user?.username ?? "",
    });
  }, [user]);

  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      const payload: { name?: string; username?: string } = {};
      const name = profile.name.trim();
      const username = profile.username.trim();
      if (name) payload.name = name;
      if (username) payload.username = username;

      const res = await usersAPI.updateMe(payload);
      const u = res.data.data;

      if (u?.id && u?.username && u?.name && u?.role) {
        updateUser({ id: u.id, username: u.username, name: u.name, role: u.role });
      }

      toast.success("پروفائل اپ ڈیٹ ہو گیا");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "پروفائل اپ ڈیٹ نہیں ہوا");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (!password.currentPassword || !password.newPassword) {
      toast.error("تمام خانے پُر کریں");
      return;
    }

    try {
      setSavingPassword(true);
      await usersAPI.changePassword(password);
      setPassword({ currentPassword: "", newPassword: "" });
      toast.success("پاس ورڈ تبدیل ہو گیا");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "پاس ورڈ تبدیل نہیں ہو سکا");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DashboardLayout title="پروفائل">
      <PageHeader title="پروفائل" description="اپنی معلومات اور پاس ورڈ اپ ڈیٹ کریں" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              پروفائل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">نام</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">صارف نام</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="h-11"
              />
            </div>
            <Button className="w-full" onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? "محفوظ ہو رہا ہے..." : "تبدیلیاں محفوظ کریں"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              پاس ورڈ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">موجودہ پاس ورڈ</Label>
              <PasswordInput
                id="current-password"
                className="h-11"
                value={password.currentPassword}
                onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">نیا پاس ورڈ</Label>
              <PasswordInput
                id="new-password"
                className="h-11"
                value={password.newPassword}
                onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
              />
            </div>
            <Button variant="outline" className="w-full" onClick={changePassword} disabled={savingPassword}>
              {savingPassword ? "تبدیل ہو رہا ہے..." : "پاس ورڈ تبدیل کریں"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
