import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Building2,
  BedDouble,
  DoorOpen,
  Calendar,
  RefreshCw,
  Filter,
  Hotel,
} from "lucide-react";
import { toast } from "sonner";

interface Resident {
  _id: string;
  studentName: string;
  hostelId: string;
  hostelName: string;
  roomNumber: string;
  bedNumber: string;
  guardianDate: string;
  leaveDate: string;
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

export default function HostelResidents() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState("all");

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
      // Read from "beds" key where HostelBeds saves allocations
      const savedBeds = localStorage.getItem("beds");
      if (savedBeds) {
        const beds = JSON.parse(savedBeds);
        // Sort by ID (timestamp) descending to show newest first
        setResidents(beds.sort((a: any, b: any) => b._id.localeCompare(a._id)));
      } else {
        setResidents([]);
      }
    };
    
    loadData();
    
    // Listen for updates from other pages
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
      const beds = JSON.parse(savedBeds);
      setResidents(beds.sort((a: any, b: any) => b._id.localeCompare(a._id)));
    } else {
      setResidents([]);
    }
    
    setTimeout(() => {
      setLoading(false);
      toast.success("طلباء کی فہرست تازہ ہو گئی");
    }, 500);
  };

  const filteredRooms = selectedHostel === "all" 
    ? rooms 
    : rooms.filter((r) => r.hostelId === selectedHostel);

  const filteredResidents = residents.filter((r) => {
    if (selectedHostel !== "all" && r.hostelId !== selectedHostel) return false;
    if (selectedRoom !== "all" && r.roomNumber !== selectedRoom) return false;
    return true;
  });

  return (
    <DashboardLayout title="طلباء کی فہرست">
      <div className="space-y-6">
        {/* Orange Header with Stats */}
        <div className="bg-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">طلباء کی فہرست</h1>
                <p className="text-white/80 text-sm">تمام طلباء کی تفصیلات اور رہائش کی معلومات</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-sm text-white/80">کل ہاسٹلز</p>
              <p className="text-2xl font-bold">{hostels.length}</p>
            </div>
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
            {/* Room Filter Block */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-gray-700">
                <DoorOpen className="h-4 w-4" />
                <span className="text-sm font-medium">کمرہ</span>
              </div>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className="text-right border-gray-300 h-10 w-56">
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

            {/* Hostel Filter Block */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-gray-700">
                <Hotel className="h-4 w-4" />
                <span className="text-sm font-medium">ہاسٹل</span>
              </div>
              <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                <SelectTrigger className="text-right border-gray-300 h-10 w-56">
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

            {/* Refresh Button */}
            <Button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 h-10"
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? "animate-spin" : ""}`} />
              تازہ کریں
            </Button>
          </div>
        </Card>

        {/* Residents Table */}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredResidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      کوئی طالب علم نہیں ملا
                    </td>
                  </tr>
                ) : (
                  filteredResidents.map((resident) => (
                    <tr key={resident._id} className="hover:bg-gray-50 text-center">
                      <td className="px-4 py-3 font-medium">{resident.studentName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{resident.hostelName}</td>
                      <td className="px-4 py-3 text-sm">{resident.roomNumber}</td>
                      <td className="px-4 py-3 text-sm">{resident.bedNumber}</td>
                      <td className="px-4 py-3 text-sm">{resident.guardianDate || "-"}</td>
                      <td className="px-4 py-3 text-sm">{resident.leaveDate || "-"}</td>
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
