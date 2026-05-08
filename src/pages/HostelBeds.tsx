import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Building2,
  BedDouble,
  DoorOpen,
  Calendar,
  RefreshCw,
  Filter,
  Hotel,
  CheckSquare,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Bed {
  _id: string;
  bedNumber: string;
  hostelId: string;
  hostelName: string;
  roomNumber: string;
  studentName: string;
  statusType?: string;
  guardianDate: string;
  leaveDate: string;
  isOccupied: boolean;
}

interface Hostel {
  _id: string;
  name: string;
}

interface Room {
  _id: string;
  roomNumber: string;
  hostelId: string;
}

export default function HostelBeds() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedHostel, setSelectedHostel] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState("all");

  const [newAllocation, setNewAllocation] = useState({
    studentName: "",
    statusType: "قدیم",
    hostelId: "",
    roomNumber: "",
    bedNumber: "",
    guardianDate: "",
    leaveDate: "",
  });

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      const savedHostels = localStorage.getItem("hostels");
      if (savedHostels) {
        setHostels(JSON.parse(savedHostels));
      }
      const savedRooms = localStorage.getItem("rooms");
      if (savedRooms) {
        setRooms(JSON.parse(savedRooms));
      }
      const savedBeds = localStorage.getItem("beds");
      if (savedBeds) {
        const parsedBeds = JSON.parse(savedBeds);
        // Sort by ID (timestamp) descending to show newest first
        setBeds(parsedBeds.sort((a: any, b: any) => b._id.localeCompare(a._id)));
      }
    };
    
    loadData();
    
    // Listen for custom event from other pages in same tab
    const handleHostelsUpdated = () => {
      loadData();
    };
    window.addEventListener("hostelsUpdated", handleHostelsUpdated);
    
    // Listen for storage events from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "beds" || e.key === "hostels" || e.key === "rooms") {
        loadData();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("hostelsUpdated", handleHostelsUpdated);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Refresh data when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      const savedHostels = localStorage.getItem("hostels");
      if (savedHostels) {
        setHostels(JSON.parse(savedHostels));
      }
      const savedRooms = localStorage.getItem("rooms");
      if (savedRooms) {
        setRooms(JSON.parse(savedRooms));
      }
    }
  }, [isDialogOpen]);

  const handleRefresh = () => {
    setLoading(true);
    
    // Actually reload data from localStorage
    const savedHostels = localStorage.getItem("hostels");
    if (savedHostels) {
      setHostels(JSON.parse(savedHostels));
    }
    const savedRooms = localStorage.getItem("rooms");
    if (savedRooms) {
      setRooms(JSON.parse(savedRooms));
    }
    const savedBeds = localStorage.getItem("beds");
    if (savedBeds) {
      const parsedBeds = JSON.parse(savedBeds);
      setBeds(parsedBeds.sort((a: any, b: any) => b._id.localeCompare(a._id)));
    }
    
    setTimeout(() => {
      setLoading(false);
      toast.success("بیڈ الوکیشن کی فہرست تازہ ہو گئی");
    }, 500);
  };

  const handleNewAllocation = () => {
    if (!newAllocation.studentName || !newAllocation.hostelId || !newAllocation.roomNumber || !newAllocation.bedNumber) {
      toast.error("براہ کرم تمام ضروری فیلڈز پر کریں");
      return;
    }

    const selectedRoomData = rooms.find(r => r.hostelId === newAllocation.hostelId && r.roomNumber === newAllocation.roomNumber);
    
    if (selectedRoomData) {
      // Check if bed number is already occupied in this room
      const existingBed = beds.find(b => 
        b.hostelId === newAllocation.hostelId && 
        b.roomNumber === newAllocation.roomNumber && 
        b.bedNumber === newAllocation.bedNumber && 
        b.isOccupied
      );

      if (existingBed) {
        setErrorMessage(`بستر نمبر ${newAllocation.bedNumber} پہلے سے ${existingBed.studentName} (${existingBed.statusType || 'مقیم'}) کے پاس ہے!`);
        setIsErrorDialogOpen(true);
        return;
      }

      // Find actual occupancy for this room
      const currentOccupied = beds.filter(b => b.hostelId === newAllocation.hostelId && b.roomNumber === newAllocation.roomNumber && b.isOccupied).length;
      const totalCapacity = (selectedRoomData as any).capacity || 0;

      if (currentOccupied >= totalCapacity && totalCapacity > 0) {
        setErrorMessage(`اس کمرے کی گنجائش (${totalCapacity}) ختم ہو چکی ہے!`);
        setIsErrorDialogOpen(true);
        return;
      }
    }

    const hostel = hostels.find((h) => h._id === newAllocation.hostelId);
    const bed: Bed = {
      _id: Date.now().toString(),
      studentName: newAllocation.studentName,
      statusType: newAllocation.statusType,
      hostelId: newAllocation.hostelId,
      hostelName: hostel?.name || "",
      roomNumber: newAllocation.roomNumber,
      bedNumber: newAllocation.bedNumber,
      guardianDate: newAllocation.guardianDate,
      leaveDate: newAllocation.leaveDate,
      isOccupied: true,
    };

    const updatedBeds = [bed, ...beds];
    setBeds(updatedBeds);
    localStorage.setItem("beds", JSON.stringify(updatedBeds));
    
    // Update hostel occupied count
    const savedHostels = localStorage.getItem("hostels");
    if (savedHostels) {
      const hostelsList = JSON.parse(savedHostels);
      const updatedHostels = hostelsList.map((h: any) =>
        h._id === newAllocation.hostelId 
          ? { ...h, occupied: (h.occupied || 0) + 1 } 
          : h
      );
      localStorage.setItem("hostels", JSON.stringify(updatedHostels));
    }

    // Update room occupied count
    const savedRooms = localStorage.getItem("rooms");
    if (savedRooms) {
      const roomsList = JSON.parse(savedRooms);
      const updatedRooms = roomsList.map((r: any) =>
        (r.hostelId === newAllocation.hostelId && r.roomNumber === newAllocation.roomNumber)
          ? { ...r, occupied: (r.occupied || 0) + 1 }
          : r
      );
      localStorage.setItem("rooms", JSON.stringify(updatedRooms));
    }
    
    // Notify all components
    window.dispatchEvent(new CustomEvent("hostelsUpdated"));
    
    setNewAllocation({ studentName: "", statusType: "قدیم", hostelId: "", roomNumber: "", bedNumber: "", guardianDate: "", leaveDate: "" });
    setIsDialogOpen(false);
    toast.success("نئی بیڈ الوکیشن کامیابی سے شامل ہو گئی");
  };

  const handleDeleteAllocation = (bed: Bed) => {
    const updatedBeds = beds.filter((b) => b._id !== bed._id);
    setBeds(updatedBeds);
    localStorage.setItem("beds", JSON.stringify(updatedBeds));
    
    // Update hostel occupied count
    const savedHostels = localStorage.getItem("hostels");
    if (savedHostels) {
      const hostelsList = JSON.parse(savedHostels);
      const updatedHostels = hostelsList.map((h: any) =>
        h._id === bed.hostelId 
          ? { ...h, occupied: Math.max(0, (h.occupied || 0) - 1) } 
          : h
      );
      localStorage.setItem("hostels", JSON.stringify(updatedHostels));
    }

    // Update room occupied count
    const savedRooms = localStorage.getItem("rooms");
    if (savedRooms) {
      const roomsList = JSON.parse(savedRooms);
      const updatedRooms = roomsList.map((r: any) =>
        (r.hostelId === bed.hostelId && r.roomNumber === bed.roomNumber)
          ? { ...r, occupied: Math.max(0, (r.occupied || 0) - 1) }
          : r
      );
      localStorage.setItem("rooms", JSON.stringify(updatedRooms));
    }
    
    // Notify all components
    window.dispatchEvent(new CustomEvent("hostelsUpdated"));
    toast.success("بیڈ الوکیشن کامیابی سے حذف ہو گئی");
  };

  const filteredRooms = selectedHostel === "all" 
    ? rooms 
    : rooms.filter((r) => r.hostelId === selectedHostel);

  const allocationFilteredRooms = newAllocation.hostelId === ""
    ? []
    : rooms.filter((r) => r.hostelId === newAllocation.hostelId);

  const filteredBeds = beds.filter((b) => {
    if (selectedHostel !== "all" && b.hostelId !== selectedHostel) return false;
    if (selectedRoom !== "all" && b.roomNumber !== selectedRoom) return false;
    
    // Dynamic status calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const leaveDate = b.leaveDate ? new Date(b.leaveDate) : null;
    const isActuallyActive = leaveDate ? leaveDate >= today : true;

    if (selectedStudent === "active" && !isActuallyActive) return false;
    if (selectedStudent === "inactive" && isActuallyActive) return false;
    
    return true;
  });

  const getBedStatus = (bed: Bed) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const leaveDate = bed.leaveDate ? new Date(bed.leaveDate) : null;
    const isActive = leaveDate ? leaveDate >= today : true;
    
    return isActive;
  };

  return (
    <DashboardLayout title="بیڈ الوکیشن کی فہرست">
      <div className="space-y-6">
        {/* Error Dialog */}
        <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <div className="flex flex-col items-center justify-center space-y-4 py-4" dir="rtl">
              <div className="bg-red-100 p-3 rounded-full">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">گنجائش ختم!</h2>
              <p className="text-center text-gray-600 font-medium leading-relaxed">
                {errorMessage}
              </p>
              <Button 
                onClick={() => setIsErrorDialogOpen(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-lg"
              >
                ٹھیک ہے
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Orange Header */}
        <div className="bg-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <BedDouble className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">بیڈ الوکیشن کی فہرست</h1>
                <p className="text-white/80 text-sm">تمام بیڈ الوکیشنز کی تفصیلات اور معلومات</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-orange-600 hover:bg-white/90 font-bold px-6">
                  <Plus className="h-5 w-5 ml-2" />
                  نئی الوکیشن
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-right">نئی بیڈ الوکیشن</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4" dir="rtl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentName">طالب علم کا نام *</Label>
                      <Input
                        id="studentName"
                        value={newAllocation.studentName}
                        onChange={(e) => setNewAllocation({ ...newAllocation, studentName: e.target.value })}
                        placeholder="طالب علم کا نام درج کریں"
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="statusType">کیٹیگری *</Label>
                      <Select 
                        value={newAllocation.statusType} 
                        onValueChange={(val) => setNewAllocation({ ...newAllocation, statusType: val })}
                      >
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="کیٹیگری منتخب کریں" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="قدیم">قدیم</SelectItem>
                          <SelectItem value="جدید">جدید</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hostel">ہاسٹل منتخب کریں *</Label>
                    <Select 
                      value={newAllocation.hostelId} 
                      onValueChange={(val) => setNewAllocation({ ...newAllocation, hostelId: val, roomNumber: "" })}
                    >
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="ہاسٹل منتخب کریں" />
                      </SelectTrigger>
                      <SelectContent>
                        {hostels.map((hostel) => (
                          <SelectItem key={hostel._id} value={hostel._id}>
                            {hostel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="room">کمرہ منتخب کریں *</Label>
                      {newAllocation.roomNumber && (
                        (() => {
                          const r = rooms.find(rm => rm.hostelId === newAllocation.hostelId && rm.roomNumber === newAllocation.roomNumber);
                          const occupied = beds.filter(b => b.hostelId === newAllocation.hostelId && b.roomNumber === newAllocation.roomNumber && b.isOccupied).length;
                          const total = (r as any)?.capacity || 0;
                          return (
                            <span className={`text-[10px] font-bold ${occupied >= total ? 'text-red-600' : 'text-emerald-600'}`}>
                              گنجائش: {occupied}/{total}
                            </span>
                          );
                        })()
                      )}
                    </div>
                    <Select 
                      value={newAllocation.roomNumber} 
                      onValueChange={(val) => setNewAllocation({ ...newAllocation, roomNumber: val })}
                      disabled={!newAllocation.hostelId}
                    >
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder={newAllocation.hostelId ? "کمرہ منتخب کریں" : "پہلے ہاسٹل منتخب کریں"} />
                      </SelectTrigger>
                      <SelectContent>
                        {allocationFilteredRooms.map((room) => (
                          <SelectItem key={room._id} value={room.roomNumber}>
                            کمرہ {room.roomNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bedNumber">بستر نمبر *</Label>
                    <Input
                      id="bedNumber"
                      value={newAllocation.bedNumber}
                      onChange={(e) => setNewAllocation({ ...newAllocation, bedNumber: e.target.value })}
                      placeholder="جیسے: A1, B2"
                      className="text-right"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guardianDate">از</Label>
                      <Input
                        id="guardianDate"
                        type="date"
                        value={newAllocation.guardianDate}
                        onChange={(e) => setNewAllocation({ ...newAllocation, guardianDate: e.target.value })}
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leaveDate">تک</Label>
                      <Input
                        id="leaveDate"
                        type="date"
                        value={newAllocation.leaveDate}
                        onChange={(e) => setNewAllocation({ ...newAllocation, leaveDate: e.target.value })}
                        className="text-right"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleNewAllocation}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    <CheckSquare className="h-4 w-4 ml-2" />
                    الوکیشن شامل کریں
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filter Section */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">فلٹرز</span>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4 justify-between" dir="rtl">
            {/* Hostel Filter Block */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-gray-700">
                <Hotel className="h-4 w-4" />
                <span className="text-sm font-medium">ہاسٹل</span>
              </div>
              <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                <SelectTrigger className="text-right border-gray-300 h-10 w-40">
                  <SelectValue placeholder="تمام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">تمام</SelectItem>
                  {hostels.map((hostel) => (
                    <SelectItem key={hostel._id} value={hostel._id}>
                      {hostel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room Filter Block */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-gray-700">
                <DoorOpen className="h-4 w-4" />
                <span className="text-sm font-medium">کمرہ</span>
              </div>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className="text-right border-gray-300 h-10 w-40">
                  <SelectValue placeholder="تمام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">تمام</SelectItem>
                  {filteredRooms.map((room) => (
                    <SelectItem key={room._id} value={room.roomNumber}>
                      {room.roomNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter Block */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700">حالت</span>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="text-right border-gray-300 h-10 w-40">
                  <SelectValue placeholder="تمام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">تمام</SelectItem>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="inactive">غیر فعال</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-emerald-800 hover:bg-emerald-900 text-white px-8 h-10"
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? "animate-spin" : ""}`} />
              تازہ کریں
            </Button>
          </div>
        </Card>

        {/* Beds Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-center">
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>طالب علم</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>کیٹیگری</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>ہاسٹل</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-2">
                      <DoorOpen className="h-4 w-4" />
                      <span>کمرہ</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-2">
                      <BedDouble className="h-4 w-4" />
                      <span>بستر</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>از</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>تک</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-2">
                      <span>حالت</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-2">
                      <span>عمل</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBeds.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      کوئی بستر الاٹ نہیں ہوا
                    </td>
                  </tr>
                ) : (
                  filteredBeds.map((bed) => (
                    <tr key={bed._id} className="hover:bg-gray-50/50 transition-colors text-center">
                      <td className="px-4 py-4">
                        <span className="font-medium text-gray-900">{bed.studentName}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          bed.statusType === "قدیم" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {bed.statusType || "مقیم"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{bed.hostelName}</td>
                      <td className="px-4 py-3 text-sm">{bed.roomNumber}</td>
                      <td className="px-4 py-3 text-sm font-medium">{bed.bedNumber}</td>
                      <td className="px-4 py-3 text-sm">{bed.guardianDate || "-"}</td>
                      <td className="px-4 py-3 text-sm">{bed.leaveDate || "-"}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          const isActive = getBedStatus(bed);
                          return (
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {isActive ? (
                                <>
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                  فعال
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3" />
                                  غیر فعال
                                </>
                              )}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAllocation(bed)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
