import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, RefreshCw, Trash2, Edit, BedDouble } from "lucide-react";
import { toast } from "sonner";

interface Room {
  _id: string;
  roomNumber: string;
  hostelId: string;
  hostelName: string;
  capacity: number;
  occupied: number;
}

interface Hostel {
  _id: string;
  name: string;
  address: string;
  rooms: number;
  capacity: number;
  occupied: number;
  warden: string;
  contact: string;
}

export default function HostelRooms() {
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const saved = localStorage.getItem("rooms");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [hostels, setHostels] = useState<Hostel[]>(() => {
    try {
      const saved = localStorage.getItem("hostels");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRoomDeleteDialogOpen, setIsRoomDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [newRoom, setNewRoom] = useState({
    roomNumber: "",
    hostelId: "",
    capacity: "",
  });

  // Track if this is initial mount
  const isInitialMount = useRef(true);

  // Save rooms to localStorage whenever they change (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      localStorage.setItem("rooms", JSON.stringify(rooms));
    }
  }, [rooms]);

  // Refresh hostels list when component mounts
  useEffect(() => {
    const saved = localStorage.getItem("hostels");
    if (saved) {
      setHostels(JSON.parse(saved));
    }
  }, []);

  const handleRefresh = () => {
    const savedRooms = localStorage.getItem("rooms");
    const savedHostels = localStorage.getItem("hostels");
    if (savedRooms) setRooms(JSON.parse(savedRooms));
    if (savedHostels) setHostels(JSON.parse(savedHostels));
    toast.success("فہرست تازہ ہو گئی");
  };

  const handleNewRoomSubmit = () => {
    if (!newRoom.roomNumber || !newRoom.hostelId) {
      toast.error("براہ کرم کمرہ نمبر اور ہاسٹل منتخب کریں");
      return;
    }

    const selectedHostel = hostels.find(h => h._id === newRoom.hostelId);
    if (!selectedHostel) {
      toast.error("ہاسٹل نہیں ملا");
      return;
    }

    const room: Room = {
      _id: Date.now().toString(),
      roomNumber: newRoom.roomNumber,
      hostelId: newRoom.hostelId,
      hostelName: selectedHostel.name,
      capacity: parseInt(newRoom.capacity) || 0,
      occupied: 0,
    };

    const updatedRooms = [...rooms, room];
    setRooms(updatedRooms);
    localStorage.setItem("rooms", JSON.stringify(updatedRooms));
    
    // Update hostel room count and capacity
    const savedHostels = localStorage.getItem("hostels");
    const roomCapacity = parseInt(newRoom.capacity) || 0;
    console.log("[DEBUG] Adding room - hostelId:", newRoom.hostelId, "roomCapacity:", roomCapacity);
    if (savedHostels) {
      const hostels = JSON.parse(savedHostels);
      const targetHostel = hostels.find((h: any) => h._id === newRoom.hostelId);
      console.log("[DEBUG] Before update - rooms:", targetHostel?.rooms, "capacity:", targetHostel?.capacity);
      const updatedHostels = hostels.map((h: any) =>
        h._id === newRoom.hostelId 
          ? { 
              ...h, 
              rooms: (h.rooms || 0) + 1,
              capacity: (h.capacity || 0) + roomCapacity
            } 
          : h
      );
      localStorage.setItem("hostels", JSON.stringify(updatedHostels));
      const updatedHostel = updatedHostels.find((h: any) => h._id === newRoom.hostelId);
      console.log("[DEBUG] After update - rooms:", updatedHostel?.rooms, "capacity:", updatedHostel?.capacity);
      // Notify other pages via custom event (works in same tab)
      window.dispatchEvent(new CustomEvent("hostelsUpdated"));
    } else {
      console.log("[DEBUG] No hostels found in localStorage!");
    }
    
    setNewRoom({ roomNumber: "", hostelId: "", capacity: "" });
    setIsDialogOpen(false);
    toast.success("نیا کمرہ کامیابی سے شامل ہو گیا");
  };

  const handleDelete = (room: Room) => {
    setRoomToDelete(room);
    setIsRoomDeleteDialogOpen(true);
  };

  const handleRoomDeleteConfirm = () => {
    if (!roomToDelete) return;

    // Delete related beds/allocations for this room
    const savedBeds = localStorage.getItem("beds");
    let deletedBedsCount = 0;
    if (savedBeds) {
      const beds = JSON.parse(savedBeds);
      const filteredBeds = beds.filter((b: any) => {
        if (b.roomNumber === roomToDelete.roomNumber && b.hostelId === roomToDelete.hostelId) {
          deletedBedsCount++;
          return false;
        }
        return true;
      });
      localStorage.setItem("beds", JSON.stringify(filteredBeds));
    }

    const filteredRooms = rooms.filter((r) => r._id !== roomToDelete._id);
    setRooms(filteredRooms);
    localStorage.setItem("rooms", JSON.stringify(filteredRooms));
    
    // Update hostel room count, capacity and occupied
    const savedHostels = localStorage.getItem("hostels");
    if (savedHostels) {
      const hostels = JSON.parse(savedHostels);
      const updatedHostels = hostels.map((h: any) =>
        h._id === roomToDelete.hostelId 
          ? { 
              ...h, 
              rooms: Math.max(0, (h.rooms || 0) - 1),
              capacity: Math.max(0, (h.capacity || 0) - (roomToDelete.capacity || 0)),
              occupied: Math.max(0, (h.occupied || 0) - deletedBedsCount)
            } 
          : h
      );
      localStorage.setItem("hostels", JSON.stringify(updatedHostels));
      // Notify other pages via custom event (works in same tab)
      window.dispatchEvent(new CustomEvent("hostelsUpdated"));
    }
    
    setIsRoomDeleteDialogOpen(false);
    setRoomToDelete(null);
    toast.success(`کمرہ کامیابی سے حذف ہو گیا${deletedBedsCount > 0 ? ` (اور ${deletedBedsCount} طلباء کی الوکیشنز بھی حذف ہو گئیں)` : ''}`);
  };

  const handleRoomDeleteCancel = () => {
    setIsRoomDeleteDialogOpen(false);
    setRoomToDelete(null);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setNewRoom({
      roomNumber: room.roomNumber,
      hostelId: room.hostelId,
      capacity: String(room.capacity),
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editingRoom) return;
    if (!newRoom.roomNumber || !newRoom.hostelId) {
      toast.error("براہ کرم کمرہ نمبر اور ہاسٹل منتخب کریں");
      return;
    }

    const selectedHostel = hostels.find(h => h._id === newRoom.hostelId);
    const newCapacity = parseInt(newRoom.capacity) || 0;
    const oldCapacity = editingRoom.capacity || 0;
    const capacityDiff = newCapacity - oldCapacity;
    
    const updatedRooms = rooms.map((r) =>
      r._id === editingRoom._id
        ? {
            ...r,
            roomNumber: newRoom.roomNumber,
            hostelId: newRoom.hostelId,
            hostelName: selectedHostel?.name || r.hostelName,
            capacity: newCapacity,
          }
        : r
    );
    
    setRooms(updatedRooms);
    localStorage.setItem("rooms", JSON.stringify(updatedRooms));
    
    // Update hostel capacity if changed
    if (capacityDiff !== 0 && newRoom.hostelId === editingRoom.hostelId) {
      const savedHostels = localStorage.getItem("hostels");
      if (savedHostels) {
        const hostels = JSON.parse(savedHostels);
        const updatedHostels = hostels.map((h: any) =>
          h._id === newRoom.hostelId 
            ? { 
                ...h, 
                capacity: Math.max(0, (h.capacity || 0) + capacityDiff)
              } 
            : h
        );
        localStorage.setItem("hostels", JSON.stringify(updatedHostels));
        window.dispatchEvent(new CustomEvent("hostelsUpdated"));
      }
    }
    
    setNewRoom({ roomNumber: "", hostelId: "", capacity: "" });
    setIsEditDialogOpen(false);
    setEditingRoom(null);
    toast.success("کمرے کی تفصیلات تازہ ہو گئیں");
  };

  const filteredRooms = rooms.filter(
    (r) =>
      r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.hostelName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="کمروں کی فہرست">
      <div className="space-y-6">
        {/* Orange Header */}
        <div className="bg-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <BedDouble className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">کمروں کی فہرست</h1>
                <p className="text-white/80 text-sm">تمام کمروں کی تفصیلات اور معلومات</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-orange-600 hover:bg-white/90 font-bold px-6">
                  <Plus className="h-5 w-5 ml-2" />
                  نیا کمرہ
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-right">نیا کمرہ شامل کریں</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4" dir="rtl">
                  <div className="space-y-2">
                    <Label htmlFor="roomNumber">کمرہ نمبر *</Label>
                    <Input
                      id="roomNumber"
                      value={newRoom.roomNumber}
                      onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                      placeholder="کمرہ نمبر درج کریں"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hostel">ہاسٹل *</Label>
                    <Select value={newRoom.hostelId} onValueChange={(value) => setNewRoom({ ...newRoom, hostelId: value })}>
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
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacity">گنجائش</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={newRoom.capacity}
                        onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                        placeholder="0"
                        className="text-right"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleNewRoomSubmit}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    کمرہ شامل کریں
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleRefresh}
              className="bg-emerald-800 hover:bg-emerald-900 text-white px-6"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              تازہ کریں
            </Button>
            <div className="flex-1 relative">
              <Input
                placeholder="کمرہ نمبر یا ہاسٹل کا نام تلاش کریں..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-right"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2"
              >
                <Search className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </div>
        </div>

        {/* Rooms Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-right">
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">ہاسٹل</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">کمرہ نمبر</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">تمام بیڈز</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">خالی بیڈز</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">مقیم</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">عمل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      کوئی کمرہ نہیں ملا
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map((room) => (
                    <tr key={room._id} className="hover:bg-gray-50 text-right">
                      <td className="px-4 py-3 font-medium">{room.hostelName}</td>
                      <td className="px-4 py-3 text-sm">{room.roomNumber}</td>
                      <td className="px-4 py-3 text-sm">{room.capacity}</td>
                      <td className="px-4 py-3 text-sm">{(room.capacity || 0) - (room.occupied || 0)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`${room.occupied >= room.capacity ? "text-red-600" : "text-green-600"}`}>
                          {room.occupied}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(room)}
                            className="h-8 w-8 text-emerald-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(room)}
                            className="h-8 w-8 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-right">کمرے میں ترمیم کریں</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4" dir="rtl">
              <div className="space-y-2">
                <Label htmlFor="edit-roomNumber">کمرہ نمبر *</Label>
                <Input
                  id="edit-roomNumber"
                  value={newRoom.roomNumber}
                  onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                  placeholder="کمرہ نمبر درج کریں"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hostel">ہاسٹل *</Label>
                <Select value={newRoom.hostelId} onValueChange={(value) => setNewRoom({ ...newRoom, hostelId: value })}>
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
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-capacity">گنجائش</Label>
                  <Input
                    id="edit-capacity"
                    type="number"
                    value={newRoom.capacity}
                    onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                    placeholder="0"
                    className="text-right"
                  />
                </div>
              </div>
              <Button 
                onClick={handleEditSubmit}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Edit className="h-4 w-4 ml-2" />
                تبدیلیاں محفوظ کریں
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isRoomDeleteDialogOpen} onOpenChange={setIsRoomDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-right text-red-600">حذف کرنے کی تصدیق</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4" dir="rtl">
              <p className="text-center text-lg">
                کیا آپ واقعی کمرہ نمبر <strong className="text-red-600">"{roomToDelete?.roomNumber}"</strong> کو حذف کرنا چاہتے ہیں؟
              </p>
              <p className="text-center text-sm text-gray-500">
                یہ عمل واپس نہیں کیا جا سکتا
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={handleRoomDeleteCancel}
                  variant="outline"
                  className="px-6"
                >
                  منسوخ کریں
                </Button>
                <Button 
                  onClick={handleRoomDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700 px-6"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف کریں
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
