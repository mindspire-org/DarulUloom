import { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
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
import { toast } from "sonner";
import { gradesAPI } from "@/lib/api";

interface Grade {
    id: string;
    name: string;
    type: "Dars-e-Nizami" | "Ma'had";
    capacity: number;
    currentCount: number;
    testDate: string;
    resultDate: string;
    assignDate: string;
    isActive: boolean;
}

const darsENizamiGrades = [
    "اولیٰ",
    "ثانیہ",
    "ثالثہ",
    "رابعہ",
    "خامسہ",
    "سادسہ",
    "سابعہ",
    "دورہ حدیث",
];

const mahadGrades = ["تمہید", "سال اول", "سال دوم", "سال سوم"];

export default function Grades() {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        type: "Dars-e-Nizami" as "Dars-e-Nizami" | "Ma'had",
        capacity: "",
        testDate: "",
        resultDate: "",
        assignDate: "",
    });

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await gradesAPI.getAll();
                if (!alive) return;
                const rows = (res.data.data ?? []) as any[];
                setGrades(
                    rows.map((g) => ({
                        id: g._id,
                        name: g.name,
                        type: g.type,
                        capacity: g.capacity,
                        currentCount: g.currentCount ?? 0,
                        testDate: g.testDate ? new Date(g.testDate).toISOString().slice(0, 10) : "",
                        resultDate: g.resultDate ? new Date(g.resultDate).toISOString().slice(0, 10) : "",
                        assignDate: g.assignDate ? new Date(g.assignDate).toISOString().slice(0, 10) : "",
                        isActive: g.isActive ?? true,
                    }))
                );
            } catch {
                toast.error("درجات لوڈ نہیں ہو سکیں");
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

        if (!formData.name || !formData.capacity || !formData.testDate) {
            toast.error("تمام خانے پُر کریں");
            return;
        }

        (async () => {
            try {
                if (editingGrade) {
                    const res = await gradesAPI.update(editingGrade.id, {
                        name: formData.name,
                        type: formData.type,
                        capacity: parseInt(formData.capacity),
                        testDate: formData.testDate,
                        resultDate: formData.resultDate || undefined,
                        assignDate: formData.assignDate || undefined,
                    });
                    const g = res.data.data;
                    setGrades((prev) =>
                        prev.map((x) =>
                            x.id === editingGrade.id
                                ? {
                                    ...x,
                                    name: g.name,
                                    type: g.type,
                                    capacity: g.capacity,
                                    currentCount: g.currentCount ?? 0,
                                    testDate: g.testDate ? new Date(g.testDate).toISOString().slice(0, 10) : "",
                                    resultDate: g.resultDate ? new Date(g.resultDate).toISOString().slice(0, 10) : "",
                                    assignDate: g.assignDate ? new Date(g.assignDate).toISOString().slice(0, 10) : "",
                                    isActive: g.isActive ?? true,
                                }
                                : x
                        )
                    );
                    toast.success("درجہ کامیابی سے اپ ڈیٹ ہوئی");
                } else {
                    const res = await gradesAPI.create({
                        name: formData.name,
                        type: formData.type,
                        capacity: parseInt(formData.capacity),
                        testDate: formData.testDate,
                        resultDate: formData.resultDate || undefined,
                        assignDate: formData.assignDate || undefined,
                    });
                    const g = res.data.data;
                    setGrades((prev) => [
                        {
                            id: g._id,
                            name: g.name,
                            type: g.type,
                            capacity: g.capacity,
                            currentCount: g.currentCount ?? 0,
                            testDate: g.testDate ? new Date(g.testDate).toISOString().slice(0, 10) : "",
                            resultDate: g.resultDate ? new Date(g.resultDate).toISOString().slice(0, 10) : "",
                            assignDate: g.assignDate ? new Date(g.assignDate).toISOString().slice(0, 10) : "",
                            isActive: g.isActive ?? true,
                        },
                        ...prev,
                    ]);
                    toast.success("درجہ کامیابی سے شامل ہوئی");
                }

                resetForm();
                setIsDialogOpen(false);
            } catch (e: any) {
                toast.error(e?.response?.data?.message || "درخواست مکمل نہیں ہو سکی");
            }
        })();
    };

    const handleEdit = (grade: Grade) => {
        setEditingGrade(grade);
        setFormData({
            name: grade.name,
            type: grade.type,
            capacity: grade.capacity.toString(),
            testDate: grade.testDate,
            resultDate: grade.resultDate,
            assignDate: grade.assignDate,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        (async () => {
            try {
                await gradesAPI.delete(id);
                setGrades((prev) => prev.filter((g) => g.id !== id));
                toast.success("درجہ حذف ہو گیا");
            } catch {
                toast.error("حذف نہیں ہو سکا");
            }
        })();
    };

    const resetForm = () => {
        setFormData({
            name: "",
            type: "Dars-e-Nizami",
            capacity: "",
            testDate: "",
            resultDate: "",
            assignDate: "",
        });
        setEditingGrade(null);
    };

    const darsGrades = useMemo(() => grades.filter((g) => g.type === "Dars-e-Nizami"), [grades]);
    const mahadGradesData = useMemo(() => grades.filter((g) => g.type === "Ma'had"), [grades]);

    const logoSrc = `${import.meta.env.BASE_URL}brand-logo.jpg`;

    return (
        <DashboardLayout title="درجات">
            <PageHeader
                title="درجات کا انتظام"
                description="درس نظامی اور معہد کے درجات کا انتظام کریں"
                action={
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm}>
                                <Plus className="h-4 w-4 ml-2" />
                                نیا درجہ
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingGrade ? "درجہ میں ترمیم" : "نیا درجہ شامل کریں"}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingGrade ? "موجودہ درجہ کی تفصیلات میں تبدیلی کریں" : "درس نظامی یا معہد کا نیا درجہ شامل کریں"}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">قسم</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value: "Dars-e-Nizami" | "Ma'had") =>
                                            setFormData({ ...formData, type: value, name: "" })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Dars-e-Nizami">درس نظامی</SelectItem>
                                            <SelectItem value="Ma'had">معہد</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">درجہ کا نام</Label>
                                    <Input
                                        id="name"
                                        placeholder="مثال: اولیٰ / سال اول / اپنی مرضی کا نام"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="capacity">گنجائش</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        placeholder="مثال: 50"
                                        value={formData.capacity}
                                        onChange={(e) =>
                                            setFormData({ ...formData, capacity: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="testDate">انٹری ٹیسٹ کی تاریخ</Label>
                                    <Input
                                        id="testDate"
                                        type="date"
                                        value={formData.testDate}
                                        onChange={(e) =>
                                            setFormData({ ...formData, testDate: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="resultDate">نتیجہ کی تاریخ</Label>
                                    <Input
                                        id="resultDate"
                                        type="date"
                                        value={formData.resultDate}
                                        onChange={(e) =>
                                            setFormData({ ...formData, resultDate: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="assignDate">تفویض کی تاریخ</Label>
                                    <Input
                                        id="assignDate"
                                        type="date"
                                        value={formData.assignDate}
                                        onChange={(e) =>
                                            setFormData({ ...formData, assignDate: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button type="submit" className="flex-1">
                                        {editingGrade ? "اپ ڈیٹ کریں" : "شامل کریں"}
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

            {/* Dars-e-Nizami Grades */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <img src={logoSrc} alt="Jamia" className="h-5 w-5 object-contain" />
                        درس نظامی ({darsGrades.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">درجہ</TableHead>
                                <TableHead className="text-right">گنجائش</TableHead>
                                <TableHead className="text-right">موجودہ تعداد</TableHead>
                                <TableHead className="text-right">باقی نشستیں</TableHead>
                                <TableHead className="text-right">انٹری ٹیسٹ کی تاریخ</TableHead>
                                <TableHead className="text-right">نتیجہ کی تاریخ</TableHead>
                                <TableHead className="text-right">تفویض کی تاریخ</TableHead>
                                <TableHead className="text-right">عمل</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {darsGrades.length > 0 ? (
                                darsGrades.map((grade) => (
                                    <TableRow key={grade.id}>
                                        <TableCell className="font-semibold">{grade.name}</TableCell>
                                        <TableCell>{grade.capacity}</TableCell>
                                        <TableCell>{grade.currentCount}</TableCell>
                                        <TableCell>
                                            <span
                                                className={
                                                    grade.capacity - grade.currentCount < 10
                                                        ? "text-destructive font-semibold"
                                                        : "text-success"
                                                }
                                            >
                                                {grade.capacity - grade.currentCount}
                                            </span>
                                        </TableCell>
                                        <TableCell>{grade.testDate}</TableCell>
                                        <TableCell>{grade.resultDate}</TableCell>
                                        <TableCell>{grade.assignDate}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEdit(grade)}
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(grade.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center text-muted-foreground py-8"
                                    >
                                        کوئی درجہ نہیں ملی
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Ma'had Grades */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <img src={logoSrc} alt="Jamia" className="h-5 w-5 object-contain" />
                        معہد ({mahadGradesData.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">درجہ</TableHead>
                                <TableHead className="text-right">گنجائش</TableHead>
                                <TableHead className="text-right">موجودہ تعداد</TableHead>
                                <TableHead className="text-right">باقی نشستیں</TableHead>
                                <TableHead className="text-right">انٹری ٹیسٹ کی تاریخ</TableHead>
                                <TableHead className="text-right">نتیجہ کی تاریخ</TableHead>
                                <TableHead className="text-right">تفویض کی تاریخ</TableHead>
                                <TableHead className="text-right">عمل</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mahadGradesData.length > 0 ? (
                                mahadGradesData.map((grade) => (
                                    <TableRow key={grade.id}>
                                        <TableCell className="font-semibold">{grade.name}</TableCell>
                                        <TableCell>{grade.capacity}</TableCell>
                                        <TableCell>{grade.currentCount}</TableCell>
                                        <TableCell>
                                            <span
                                                className={
                                                    grade.capacity - grade.currentCount < 10
                                                        ? "text-destructive font-semibold"
                                                        : "text-success"
                                                }
                                            >
                                                {grade.capacity - grade.currentCount}
                                            </span>
                                        </TableCell>
                                        <TableCell>{grade.testDate}</TableCell>
                                        <TableCell>{grade.resultDate}</TableCell>
                                        <TableCell>{grade.assignDate}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEdit(grade)}
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(grade.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center text-muted-foreground py-8"
                                    >
                                        کوئی درجہ نہیں ملی
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
