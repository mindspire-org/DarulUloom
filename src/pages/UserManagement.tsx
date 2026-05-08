// User Management Page - Admin Only
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Users as UsersIcon, Key } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserRole } from "@/contexts/AuthContext";
import { usersAPI, gradesAPI } from "@/lib/api";
import { PasswordInput } from "@/components/shared/PasswordInput";

interface User {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    createdAt: string;
    isActive: boolean;
    assignedClasses?: string[];
}

const roleLabels: Record<UserRole, string> = {
    admin: "منتظم",
    counter1: "کاؤنٹر 1",
    counter2: "کاؤنٹر 2",
};

function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [grades, setGrades] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        username: "",
        name: "",
        password: "",
        role: "counter1" as UserRole,
        assignedClasses: [] as string[],
    });

    useEffect(() => {
        (async () => {
            try {
                const res = await gradesAPI.getAll();
                const rows = (res.data.data ?? []) as any[];
                setGrades(rows.map((g: any) => g.name));
            } catch {
                toast.error("درجات لوڈ نہیں ہو سکیں");
            }
        })();
    }, []);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await usersAPI.getAll();
                if (!alive) return;
                const rows = (res.data.data ?? []) as any[];
                setUsers(
                    rows.map((u) => ({
                        id: u._id,
                        username: u.username,
                        name: u.name,
                        role: u.role,
                        createdAt: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : "",
                        isActive: u.isActive ?? true,
                        assignedClasses: Array.isArray(u.assignedClasses) ? u.assignedClasses : [],
                    }))
                );
            } catch {
                toast.error("صارفین لوڈ نہیں ہو سکے");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.username || !formData.name || (!editingUser && !formData.password)) {
            toast.error("تمام خانے پُر کریں");
            return;
        }

        (async () => {
            try {
                if (editingUser) {
                    const payload: any = {
                        name: formData.name,
                        role: formData.role,
                    };

                    if (formData.role === 'counter2') {
                        payload.assignedClasses = formData.assignedClasses;
                    }

                    const p = formData.password?.trim();
                    if (p) payload.password = p;

                    const res = await usersAPI.update(editingUser.id, payload);
                    const u = res.data.data;
                    setUsers((prev) =>
                        prev.map((x) =>
                            x.id === editingUser.id
                                ? {
                                    ...x,
                                    name: u.name,
                                    role: u.role,
                                    isActive: u.isActive ?? x.isActive,
                                    assignedClasses: u.assignedClasses,
                                }
                                : x
                        )
                    );
                    toast.success("صارف کامیابی سے اپ ڈیٹ ہوا");
                } else {
                    const payload: any = {
                        username: formData.username,
                        password: formData.password,
                        name: formData.name,
                        role: formData.role,
                    };

                    if (formData.role === 'counter2') {
                        payload.assignedClasses = formData.assignedClasses;
                    }

                    const res = await usersAPI.create(payload);
                    const u = res.data.data;
                    setUsers((prev) => [
                        {
                            id: u.id,
                            username: u.username,
                            name: u.name,
                            role: u.role,
                            createdAt: new Date().toISOString().slice(0, 10),
                            isActive: true,
                            assignedClasses: u.assignedClasses,
                        },
                        ...prev,
                    ]);
                    toast.success("صارف کامیابی سے شامل ہوا");
                }

                resetForm();
                setIsDialogOpen(false);
            } catch (e: any) {
                toast.error(e?.response?.data?.message || "درخواست مکمل نہیں ہو سکی");
            }
        })();
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            name: user.name,
            password: "",
            role: user.role,
            assignedClasses: Array.isArray(user.assignedClasses) ? user.assignedClasses : [],
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        const user = users.find((u) => u.id === id);
        if (user?.role === "admin") {
            toast.error("منتظم کو حذف نہیں کیا جا سکتا");
            return;
        }
        (async () => {
            try {
                await usersAPI.delete(id);
                setUsers((prev) => prev.filter((u) => u.id !== id));
                toast.success("صارف حذف ہو گیا");
            } catch (e: any) {
                toast.error(e?.response?.data?.message || "حذف نہیں ہو سکا");
            }
        })();
    };

    const toggleStatus = (id: string) => {
        const user = users.find((u) => u.id === id);
        if (!user) return;
        (async () => {
            try {
                const res = await usersAPI.update(id, { isActive: !user.isActive });
                const u = res.data.data;
                setUsers((prev) =>
                    prev.map((x) => (x.id === id ? { ...x, isActive: u.isActive } : x))
                );
                toast.success("حیثیت تبدیل ہو گئی");
            } catch {
                toast.error("حیثیت تبدیل نہیں ہو سکی");
            }
        })();
    };

    const resetForm = () => {
        setFormData({
            username: "",
            name: "",
            password: "",
            role: "counter1",
            assignedClasses: [],
        });
        setEditingUser(null);
    };

    if (loading) {
        return (
            <DashboardLayout title="صارفین">
                <div className="flex items-center justify-center h-64">لوڈنگ...</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="صارفین">
            <PageHeader
                title="صارفین کا انتظام"
                description="نئے صارفین شامل کریں اور موجودہ صارفین کا انتظام کریں"
                action={
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm}>
                                <Plus className="h-4 w-4 ml-2" />
                                نیا صارف
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingUser ? "صارف میں ترمیم" : "نیا صارف شامل کریں"}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingUser ? "موجودہ صارف کی معلومات میں تبدیلی کریں" : "کاؤنٹر اسٹاف کے لیے نیا اکاؤنٹ بنائیں"}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">صارف نام *</Label>
                                    <Input
                                        id="username"
                                        placeholder="مثال: counter3"
                                        value={formData.username}
                                        onChange={(e) =>
                                            setFormData({ ...formData, username: e.target.value })
                                        }
                                        disabled={!!editingUser}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">نام *</Label>
                                    <Input
                                        id="name"
                                        placeholder="مثال: احمد علی"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">
                                        {editingUser ? "نیا پاس ورڈ (اختیاری)" : "پاس ورڈ *"}
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        placeholder={editingUser ? "اگر تبدیل کرنا ہو تو درج کریں" : "محفوظ پاس ورڈ درج کریں"}
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData({ ...formData, password: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role">کردار *</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value: UserRole) =>
                                            setFormData({ ...formData, role: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="counter1">کاؤنٹر 1</SelectItem>
                                            <SelectItem value="counter2">کاؤنٹر 2</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.role === "counter2" && (
                                    <div className="space-y-2">
                                        <Label>درجات مختص کریں</Label>
                                        <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                                            <div className="flex items-center space-x-2 space-x-reverse col-span-2 border-b pb-2">
                                                <input
                                                    type="checkbox"
                                                    id="class-all"
                                                    checked={formData.assignedClasses.includes("all")}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({ ...formData, assignedClasses: ["all"] });
                                                        } else {
                                                            setFormData({ ...formData, assignedClasses: [] });
                                                        }
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <Label htmlFor="class-all" className="cursor-pointer">تمام درجات</Label>
                                            </div>
                                            {grades.map((g) => (
                                                <div key={g} className="flex items-center space-x-2 space-x-reverse">
                                                    <input
                                                        type="checkbox"
                                                        id={`class-${g}`}
                                                        disabled={formData.assignedClasses.includes("all")}
                                                        checked={formData.assignedClasses.includes(g)}
                                                        onChange={(e) => {
                                                            const next = e.target.checked
                                                                ? [...formData.assignedClasses, g]
                                                                : formData.assignedClasses.filter((x) => x !== g);
                                                            setFormData({ ...formData, assignedClasses: next });
                                                        }}
                                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                                                    />
                                                    <Label htmlFor={`class-${g}`} className="cursor-pointer text-xs">{g}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <Button type="submit" className="flex-1">
                                        {editingUser ? "اپ ڈیٹ کریں" : "شامل کریں"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            resetForm();
                                            setIsDialogOpen(false);
                                        }}
                                    >
                                        منسوخ
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5 text-primary" />
                        تمام صارفین ({users.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">صارف نام</TableHead>
                                <TableHead className="text-right">نام</TableHead>
                                <TableHead className="text-right">کردار</TableHead>
                                <TableHead className="text-right">درجہ</TableHead>
                                <TableHead className="text-right">تاریخ تخلیق</TableHead>
                                <TableHead className="text-right">حیثیت</TableHead>
                                <TableHead className="text-right">عمل</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-mono font-medium">
                                        {user.username}
                                    </TableCell>
                                    <TableCell className="font-semibold">{user.name}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                user.role === "admin"
                                                    ? "default"
                                                    : user.role === "counter1"
                                                        ? "secondary"
                                                        : "outline"
                                            }
                                        >
                                            {roleLabels[user.role]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.role === "counter2" ? (
                                            user.assignedClasses && user.assignedClasses.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {user.assignedClasses.includes("all") ? (
                                                        <span className="text-muted-foreground text-xs">تمام</span>
                                                    ) : (
                                                        user.assignedClasses.map((c) => (
                                                            <Badge key={c} variant="outline" className="bg-primary/10 text-[10px] py-0">
                                                                {c}
                                                            </Badge>
                                                        ))
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell>{user.createdAt}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.isActive ? "default" : "destructive"}>
                                            {user.isActive ? "فعال" : "غیر فعال"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {user.role !== "admin" && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEdit(user)}
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => toggleStatus(user.id)}
                                                    >
                                                        <Key className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => handleDelete(user.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
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

export default UserManagement;
