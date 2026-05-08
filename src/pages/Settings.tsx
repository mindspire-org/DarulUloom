import { useEffect, useState } from "react";
import { User, Bell, Shield, Palette } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { settingsAPI, usersAPI } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PasswordInput } from "@/components/shared/PasswordInput";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const SETTINGS_STORAGE_KEY = "jamia.settings";

  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    username: user?.username ?? "",
  });

  const [notifications, setNotifications] = useState({
    newAdmission: true,
    verificationReminder: true,
    emailNotifications: false,
  });

  const [appearance, setAppearance] = useState({
    darkMode: false,
    compactSidebar: false,
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        try {
          const cached = localStorage.getItem(SETTINGS_STORAGE_KEY);
          if (cached && cached !== "undefined") {
            const parsed = JSON.parse(cached);
            if (parsed?.notifications) setNotifications(parsed.notifications);
            if (parsed?.appearance) setAppearance(parsed.appearance);
          }
        } catch {
          // ignore
        }

        const res = await settingsAPI.get();
        if (!alive) return;
        const s = res.data.data;
        if (s?.notifications) setNotifications(s.notifications);
        if (s?.appearance) setAppearance(s.appearance);
      } catch {
        toast.error("سیٹنگز لوڈ نہیں ہو سکیں");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    try {
      document.documentElement.classList.toggle("dark", Boolean(appearance.darkMode));
    } catch {
      // ignore
    }

    try {
      window.dispatchEvent(new CustomEvent("jamia:appearance", { detail: appearance }));
    } catch {
      // ignore
    }
  }, [appearance]);

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

  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      await settingsAPI.update({ notifications, appearance });
      try {
        localStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify({ notifications, appearance })
        );
      } catch {
        // ignore
      }
      toast.success("سیٹنگز محفوظ ہو گئیں");
    } catch {
      toast.error("سیٹنگز محفوظ نہیں ہو سکیں");
    } finally {
      setSavingSettings(false);
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
    <DashboardLayout title="سیٹنگز">
      <PageHeader
        title="سیٹنگز"
        description="سسٹم کی ترتیبات میں تبدیلی کریں"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              پروفائل سیٹنگز
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
            <Button className="w-full" onClick={saveProfile} disabled={savingProfile || loading}>
              {savingProfile ? "محفوظ ہو رہا ہے..." : "تبدیلیاں محفوظ کریں"}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              اطلاعات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>نئے داخلے کی اطلاع</Label>
                <p className="text-sm text-muted-foreground">نئے داخلے پر اطلاع موصول کریں</p>
              </div>
              <Switch
                checked={notifications.newAdmission}
                onCheckedChange={(v) => setNotifications({ ...notifications, newAdmission: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>تصدیق کی یاد دہانی</Label>
                <p className="text-sm text-muted-foreground">زیر التوا درخواستوں کی یاد دہانی</p>
              </div>
              <Switch
                checked={notifications.verificationReminder}
                onCheckedChange={(v) =>
                  setNotifications({ ...notifications, verificationReminder: v })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>ای میل اطلاعات</Label>
                <p className="text-sm text-muted-foreground">اہم اطلاعات ای میل پر بھیجیں</p>
              </div>
              <Switch
                checked={notifications.emailNotifications}
                onCheckedChange={(v) => setNotifications({ ...notifications, emailNotifications: v })}
              />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={saveSettings}
              disabled={savingSettings || loading}
            >
              {savingSettings ? "محفوظ ہو رہا ہے..." : "سیٹنگز محفوظ کریں"}
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              سیکیورٹی
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
            <Button
              variant="outline"
              className="w-full"
              onClick={changePassword}
              disabled={savingPassword}
            >
              {savingPassword ? "تبدیل ہو رہا ہے..." : "پاس ورڈ تبدیل کریں"}
            </Button>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              ظاہری شکل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>ڈارک موڈ</Label>
                <p className="text-sm text-muted-foreground">تاریک تھیم استعمال کریں</p>
              </div>
              <Switch
                checked={appearance.darkMode}
                onCheckedChange={(v) => setAppearance({ ...appearance, darkMode: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>مختصر سائڈبار</Label>
                <p className="text-sm text-muted-foreground">سائڈبار کو چھوٹا رکھیں</p>
              </div>
              <Switch
                checked={appearance.compactSidebar}
                onCheckedChange={(v) =>
                  setAppearance({ ...appearance, compactSidebar: v })
                }
              />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={saveSettings}
              disabled={savingSettings || loading}
            >
              {savingSettings ? "محفوظ ہو رہا ہے..." : "سیٹنگز محفوظ کریں"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
