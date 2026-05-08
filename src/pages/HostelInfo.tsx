import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  RefreshCw, 
  Search, 
  Building2,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { toast } from "sonner";

interface Hostel {
  _id: string;
  name: string;
  rooms: number;
  capacity: number;
  occupied: number;
  warden: string;
  contact: string;
}

export default function HostelInfo() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hostels, setHostels] = useState<Hostel[]>(() => {
    const saved = localStorage.getItem("hostels");
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      {
        _id: "1",
        name: "ہاسٹل نمبر 1",
        rooms: 50,
        capacity: 200,
        occupied: 150,
        warden: "مولانا عبداللہ",
        contact: "0300-1234567",
      },
      {
        _id: "2",
        name: "ہاسٹل نمبر 2",
        rooms: 40,
        capacity: 160,
        occupied: 120,
        warden: "مولانا محمد علی",
        contact: "0301-9876543",
      },
    ];
  });
  // Save to localStorage whenever hostels change
  useEffect(() => {
    localStorage.setItem("hostels", JSON.stringify(hostels));
  }, [hostels]);

  // Listen for storage changes from other pages
  useEffect(() => {
    const loadHostels = () => {
      const saved = localStorage.getItem("hostels");
      if (saved) {
        setHostels(JSON.parse(saved));
      }
    };
    
    // Listen for custom event from other pages in same tab
    const handleHostelsUpdated = () => {
      loadHostels();
    };
    window.addEventListener("hostelsUpdated", handleHostelsUpdated);
    
    // Also listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "hostels") {
        loadHostels();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("hostelsUpdated", handleHostelsUpdated);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [newHostel, setNewHostel] = useState({
    name: "",
    rooms: "",
    capacity: "0",
    warden: "",
    contact: "",
  });
  const [newRoomCountInput, setNewRoomCountInput] = useState("");
  const [newRoomCapacities, setNewRoomCapacities] = useState<string[]>([]);

  const [editHostel, setEditHostel] = useState({
    name: "",
    rooms: "",
    capacity: "0",
    warden: "",
    contact: "",
  });
  const [editRoomCountInput, setEditRoomCountInput] = useState("");
  const [editRoomCapacities, setEditRoomCapacities] = useState<string[]>([]);

  // Initialize/Resize room capacities for new hostel
  useEffect(() => {
    const r = parseInt(newHostel.rooms) || 0;
    setNewRoomCapacities(prev => {
      const next = [...prev];
      if (r > next.length) {
        for (let i = next.length; i < r; i++) next.push("4"); // Default to 4 beds
      } else if (r < next.length) {
        next.splice(r);
      }
      return next;
    });
  }, [newHostel.rooms]);

  // Calculate capacity for new hostel
  useEffect(() => {
    const total = newRoomCapacities.reduce((sum, cap) => sum + (parseInt(cap) || 0), 0);
    setNewHostel(prev => ({ ...prev, capacity: String(total) }));
  }, [newRoomCapacities]);

  // Initialize/Resize room capacities for edit hostel
  useEffect(() => {
    const r = parseInt(editHostel.rooms) || 0;
    setEditRoomCapacities(prev => {
      const next = [...prev];
      if (r > next.length) {
        for (let i = next.length; i < r; i++) next.push("4");
      } else if (r < next.length) {
        next.splice(r);
      }
      return next;
    });
  }, [editHostel.rooms]);

  // Calculate capacity for edit hostel
  useEffect(() => {
    const total = editRoomCapacities.reduce((sum, cap) => sum + (parseInt(cap) || 0), 0);
    setEditHostel(prev => ({ ...prev, capacity: String(total) }));
  }, [editRoomCapacities]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hostelToDelete, setHostelToDelete] = useState<Hostel | null>(null);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Hostel ki fehrist taza ho gayi");
    }, 1000);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Bara-e-meherbani talash ka naam darj karein");
      return;
    }
    toast.success(`"${searchQuery}" ke liye talash jari`);
  };

  const handleNewHostelSubmit = () => {
    if (!newHostel.name) {
      toast.error("Bara-e-meherbani tamam zaroori fields pur karein");
      return;
    }
    
    const hostelId = Date.now().toString();
    const roomCount = parseInt(newHostel.rooms) || 0;
    
    const hostel: Hostel = {
      _id: hostelId,
      name: newHostel.name,
      rooms: roomCount,
      capacity: parseInt(newHostel.capacity) || 0,
      occupied: 0,
      warden: newHostel.warden,
      contact: newHostel.contact,
    };
    
    // Create actual room records if rooms count > 0
    if (roomCount > 0) {
      const savedRooms = localStorage.getItem("rooms");
      const existingRooms: any[] = savedRooms ? JSON.parse(savedRooms) : [];
      
      const newRooms = [];
      for (let i = 1; i <= roomCount; i++) {
        newRooms.push({
          _id: (Date.now() + i).toString(),
          roomNumber: String(i),
          hostelId: hostelId,
          hostelName: newHostel.name,
          capacity: parseInt(newRoomCapacities[i-1]) || 0,
          occupied: 0,
        });
      }
      
      const allRooms = [...existingRooms, ...newRooms];
      localStorage.setItem("rooms", JSON.stringify(allRooms));
      // Notify other pages
      window.dispatchEvent(new CustomEvent("hostelsUpdated"));
    }
    
    setHostels([...hostels, hostel]);
    setNewHostel({ name: "", rooms: "", capacity: "0", warden: "", contact: "" });
    setNewRoomCountInput("");
    setIsDialogOpen(false);
    toast.success("Naya hostel kamyabi se shamil ho gaya");
  };

  const handleView = (hostel: Hostel) => {
    setSelectedHostel(hostel);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (hostel: Hostel) => {
    setSelectedHostel(hostel);
    
    // Load room capacities from localStorage
    const savedRooms = localStorage.getItem("rooms");
    let capacities: string[] = [];
    if (savedRooms) {
      const allRooms = JSON.parse(savedRooms);
      const hostelRooms = allRooms
        .filter((r: any) => r.hostelId === hostel._id)
        .sort((a: any, b: any) => parseInt(a.roomNumber) - parseInt(b.roomNumber));
      
      capacities = hostelRooms.map((r: any) => String(r.capacity));
    }
    
    // If no rooms found in storage, initialize with current rooms count
    if (capacities.length === 0) {
      capacities = Array(hostel.rooms || 0).fill("4");
    } else if (capacities.length !== hostel.rooms) {
      // Force sync with hostel rooms count if mismatch exists in localStorage
      const r = hostel.rooms || 0;
      if (r > capacities.length) {
        for (let i = capacities.length; i < r; i++) capacities.push("4");
      } else {
        capacities = capacities.slice(0, r);
      }
    }

    setEditRoomCapacities(capacities);
    setEditRoomCountInput(String(hostel.rooms));
    setEditHostel({
      name: hostel.name,
      rooms: String(hostel.rooms),
      capacity: String(hostel.capacity),
      warden: hostel.warden,
      contact: hostel.contact,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!selectedHostel) return;
    if (!editHostel.name) {
      toast.error("Bara-e-meherbani tamam zaroori fields pur karein");
      return;
    }
    
    const updatedHostels = hostels.map((h) =>
      h._id === selectedHostel._id
        ? {
            ...h,
            name: editHostel.name,
            rooms: parseInt(editHostel.rooms) || 0,
            capacity: parseInt(editHostel.capacity) || 0,
            warden: editHostel.warden,
            contact: editHostel.contact,
          }
        : h
    );
    
    // Also update individual room capacities in localStorage
    const savedRooms = localStorage.getItem("rooms");
    if (savedRooms) {
      const allRooms = JSON.parse(savedRooms);
      const otherHostelsRooms = allRooms.filter((r: any) => r.hostelId !== selectedHostel._id);
      
      // Create new set of room objects for this hostel, preserving existing data if any
      const existingHostelRooms = allRooms.filter((r: any) => r.hostelId === selectedHostel._id)
        .sort((a: any, b: any) => parseInt(a.roomNumber) - parseInt(b.roomNumber));

      const updatedHostelRooms = editRoomCapacities.map((cap, idx) => {
        const roomNumber = String(idx + 1);
        const existingRoom = existingHostelRooms.find(r => r.roomNumber === roomNumber);
        
        if (existingRoom) {
          return {
            ...existingRoom,
            hostelName: editHostel.name,
            capacity: parseInt(cap) || 0
          };
        } else {
          return {
            _id: (Date.now() + idx).toString(),
            roomNumber: roomNumber,
            hostelId: selectedHostel._id,
            hostelName: editHostel.name,
            capacity: parseInt(cap) || 0,
            occupied: 0,
          };
        }
      });
      
      const updatedAllRooms = [...otherHostelsRooms, ...updatedHostelRooms];
      localStorage.setItem("rooms", JSON.stringify(updatedAllRooms));
      window.dispatchEvent(new CustomEvent("hostelsUpdated"));
    }
    
    setHostels(updatedHostels);
    setIsEditDialogOpen(false);
    setSelectedHostel(null);
    toast.success("Hostel ki tafseelat kamyabi se taza ho gayin");
  };

  const handleDeleteClick = (hostel: Hostel) => {
    setHostelToDelete(hostel);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!hostelToDelete) return;
    
    // Delete the hostel
    const filteredHostels = hostels.filter((h) => h._id !== hostelToDelete._id);
    setHostels(filteredHostels);
    
    // Delete related rooms
    const savedRooms = localStorage.getItem("rooms");
    if (savedRooms) {
      const rooms = JSON.parse(savedRooms);
      const filteredRooms = rooms.filter((r: any) => r.hostelId !== hostelToDelete._id);
      localStorage.setItem("rooms", JSON.stringify(filteredRooms));
    }
    
    // Delete related beds
    const savedBeds = localStorage.getItem("beds");
    if (savedBeds) {
      const beds = JSON.parse(savedBeds);
      const filteredBeds = beds.filter((b: any) => b.hostelId !== hostelToDelete._id);
      localStorage.setItem("beds", JSON.stringify(filteredBeds));
    }
    
    setIsDeleteDialogOpen(false);
    setHostelToDelete(null);
    toast.success(`"${hostelToDelete.name}" kamyabi se hazf ho gaya aur us ke tamam mutaliqa records bhi saaf ho gaye`);
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setHostelToDelete(null);
  };

  const filteredHostels = hostels.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.warden.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="ہاسٹل کی فہرست">
      <div className="space-y-6">
        {/* Orange Header */}
        <div className="bg-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">ہاسٹل کی فہرست</h1>
                <p className="text-white/80 text-sm">تمام ہاسٹلوں کی تفصیلات اور معلومات</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setNewHostel({ name: "", rooms: "", capacity: "0", warden: "", contact: "" });
                setNewRoomCountInput("");
                setNewRoomCapacities([]);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-white text-orange-600 hover:bg-white/90 font-bold px-6">
                  <Plus className="h-5 w-5 ml-2" />
                  نیا ہاسٹل
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-right">نیا ہاسٹل شامل کریں</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4" dir="rtl">
                  <div className="space-y-2">
                    <Label htmlFor="name">ہاسٹل کا نام *</Label>
                    <Input
                      id="name"
                      value={newHostel.name}
                      onChange={(e) => setNewHostel({ ...newHostel, name: e.target.value })}
                      placeholder="ہاسٹل کا نام درج کریں"
                      className="text-right"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rooms">کمروں کی تعداد</Label>
                      <Input
                        id="rooms"
                        type="number"
                        value={newRoomCountInput}
                        onChange={(e) => setNewRoomCountInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setNewHostel(prev => ({ ...prev, rooms: newRoomCountInput }));
                          }
                        }}
                        placeholder="0"
                        className="text-right"
                      />
                      <p className="text-[9px] text-gray-400 mt-1">Enter دبائیں تاکہ کمروں کی لسٹ اپڈیٹ ہو</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity">کل گنجائش</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={newHostel.capacity}
                        readOnly
                        className="text-right bg-gray-50 font-bold text-emerald-700"
                      />
                    </div>
                  </div>

                  {parseInt(newHostel.rooms) > 0 && (
                    <div className="space-y-2 border p-3 rounded-lg bg-gray-50/50">
                      <Label className="text-xs text-gray-500 mb-2 block">ہر کمرے کے بستروں کی تعداد درج کریں:</Label>
                      <div className="grid grid-cols-5 gap-2 max-h-[150px] overflow-y-auto p-1">
                        {newRoomCapacities.map((cap, idx) => (
                          <div key={idx} className="space-y-1">
                            <span className="text-[10px] text-gray-400 block text-center">کمرہ {idx + 1}</span>
                            <Input
                              type="number"
                              value={cap}
                              onChange={(e) => {
                                const next = [...newRoomCapacities];
                                next[idx] = e.target.value;
                                setNewRoomCapacities(next);
                              }}
                              className="h-8 text-center text-xs p-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="warden">واڈن کا نام</Label>
                    <Input
                      id="warden"
                      value={newHostel.warden}
                      onChange={(e) => setNewHostel({ ...newHostel, warden: e.target.value })}
                      placeholder="واڈن کا نام درج کریں"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">رابطہ نمبر</Label>
                    <Input
                      id="contact"
                      value={newHostel.contact}
                      onChange={(e) => setNewHostel({ ...newHostel, contact: e.target.value })}
                      placeholder="0300-1234567"
                      className="text-right"
                    />
                  </div>
                  <Button 
                    onClick={handleNewHostelSubmit}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    ہاسٹل شامل کریں
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
              disabled={loading}
              className="bg-emerald-800 hover:bg-emerald-900 text-white px-6"
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? "animate-spin" : ""}`} />
              تازہ کریں
            </Button>
            <div className="flex-1 relative">
              <Input
                placeholder="ہاسٹل کا نام تلاش کریں..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pr-10 text-right"
              />
              <Button
                onClick={handleSearch}
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2"
              >
                <Search className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </div>
        </div>

        {/* Hostels Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-right">
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">نام</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">کمرے</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">گنجائش</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">مقیم</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">واڈن</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">رابطہ</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">عمل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredHostels.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      کوئی ہاسٹل نہیں ملا
                    </td>
                  </tr>
                ) : (
                  filteredHostels.map((hostel) => (
                    <tr key={hostel._id} className="hover:bg-gray-50 text-right">
                      <td className="px-4 py-3 font-medium">{hostel.name}</td>
                      <td className="px-4 py-3 text-sm">{hostel.rooms}</td>
                      <td className="px-4 py-3 text-sm">{hostel.capacity}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`${hostel.occupied >= hostel.capacity ? "text-red-600" : "text-green-600"}`}>
                          {hostel.occupied}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{hostel.warden}</td>
                      <td className="px-4 py-3 text-sm font-mono">{hostel.contact}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(hostel)}
                            className="h-8 w-8 text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(hostel)}
                            className="h-8 w-8 text-emerald-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(hostel)}
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

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-right">ہاسٹل کی تفصیلات</DialogTitle>
            </DialogHeader>
            {selectedHostel && (
              <div className="space-y-4 mt-4" dir="rtl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-gray-500">ہاسٹل کا نام</Label>
                    <p className="font-medium">{selectedHostel.name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-500">واڈن</Label>
                    <p className="font-medium">{selectedHostel.warden}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-gray-500">کمرے</Label>
                    <p className="font-medium">{selectedHostel.rooms}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-500">گنجائش</Label>
                    <p className="font-medium">{selectedHostel.capacity}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-500">مقیم</Label>
                    <p className={`font-medium ${selectedHostel.occupied >= selectedHostel.capacity ? "text-red-600" : "text-green-600"}`}>
                      {selectedHostel.occupied}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500">رابطہ نمبر</Label>
                  <p className="font-medium font-mono">{selectedHostel.contact}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditHostel({ name: "", rooms: "", capacity: "0", warden: "", contact: "" });
            setEditRoomCountInput("");
            setEditRoomCapacities([]);
            setSelectedHostel(null);
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-right">ہاسٹل میں ترمیم کریں</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4" dir="rtl">
              <div className="space-y-2">
                <Label htmlFor="edit-name">ہاسٹل کا نام *</Label>
                <Input
                  id="edit-name"
                  value={editHostel.name}
                  onChange={(e) => setEditHostel({ ...editHostel, name: e.target.value })}
                  placeholder="ہاسٹل کا naam darj karein"
                  className="text-right"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-rooms">کمروں کی تعداد</Label>
                  <Input
                    id="edit-rooms"
                    type="number"
                    value={editRoomCountInput}
                    onChange={(e) => setEditRoomCountInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEditHostel(prev => ({ ...prev, rooms: editRoomCountInput }));
                      }
                    }}
                    placeholder="0"
                    className="text-right"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">Enter دبائیں تاکہ کمروں کی لسٹ اپڈیٹ ہو</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-capacity">کل گنجائش</Label>
                  <Input
                    id="edit-capacity"
                    type="number"
                    value={editHostel.capacity}
                    readOnly
                    className="text-right bg-gray-50 font-bold text-emerald-700"
                  />
                </div>
              </div>

              {parseInt(editHostel.rooms) > 0 && (
                <div className="space-y-2 border p-3 rounded-lg bg-gray-50/50">
                  <Label className="text-xs text-gray-500 mb-2 block">ہر کمرے کے بستروں کی تعداد درج کریں:</Label>
                  <div className="grid grid-cols-5 gap-2 max-h-[150px] overflow-y-auto p-1">
                    {editRoomCapacities.map((cap, idx) => (
                      <div key={idx} className="space-y-1">
                        <span className="text-[10px] text-gray-400 block text-center">کمرہ {idx + 1}</span>
                        <Input
                          type="number"
                          value={cap}
                          onChange={(e) => {
                            const next = [...editRoomCapacities];
                            next[idx] = e.target.value;
                            setEditRoomCapacities(next);
                          }}
                          className="h-8 text-center text-xs p-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-warden">واڈن کا نام</Label>
                <Input
                  id="edit-warden"
                  value={editHostel.warden}
                  onChange={(e) => setEditHostel({ ...editHostel, warden: e.target.value })}
                  placeholder="واڈن کا نام درج کریں"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact">رابطہ نمبر</Label>
                <Input
                  id="edit-contact"
                  value={editHostel.contact}
                  onChange={(e) => setEditHostel({ ...editHostel, contact: e.target.value })}
                  placeholder="0300-1234567"
                  className="text-right"
                />
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
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-right text-red-600">حذف کرنے کی تصدیق</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4" dir="rtl">
              <p className="text-center text-lg">
                کیا آپ واقعی <strong className="text-red-600">"{hostelToDelete?.name}"</strong> کو حذف کرنا چاہتے ہیں؟
              </p>
              <p className="text-center text-sm text-gray-500">
                یہ عمل واپس نہیں کیا جا سکتا
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={handleDeleteCancel}
                  variant="outline"
                  className="px-6"
                >
                  منسوخ کریں
                </Button>
                <Button 
                  onClick={handleDeleteConfirm}
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
