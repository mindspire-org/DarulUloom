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
  Building2,
  Users,
  BedDouble,
  Home,
  Hotel,
  Filter,
  DoorOpen,
} from "lucide-react";

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

interface Room {
  _id: string;
  roomNumber: string;
  hostelId: string;
  hostelName: string;
  capacity: number;
  occupied: number;
}

interface Bed {
  _id: string;
  bedNumber: string;
  roomNumber: string;
  hostelId: string;
  studentName: string;
  isOccupied: boolean;
}

interface Stats {
  totalHostels: number;
  totalRooms: number;
  totalBeds: number;
  emptyBeds: number;
  occupiedBeds: number;
}

export default function HostelDashboard() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalHostels: 0,
    totalRooms: 0,
    totalBeds: 0,
    emptyBeds: 0,
    occupiedBeds: 0,
  });

  useEffect(() => {
    const loadData = () => {
      const savedHostels = localStorage.getItem("hostels");
      const savedRooms = localStorage.getItem("rooms");
      const savedBeds = localStorage.getItem("beds");

      if (savedHostels) {
        const parsedHostels: Hostel[] = JSON.parse(savedHostels);
        setHostels(parsedHostels);
        
        const totalHostels = parsedHostels.length;
        const totalRooms = parsedHostels.reduce((sum, h) => sum + h.rooms, 0);
        const totalBeds = parsedHostels.reduce((sum, h) => sum + h.capacity, 0);
        
        // Calculate occupied from actual beds data
        let occupiedBeds = 0;
        if (savedBeds) {
          const parsedBeds: Bed[] = JSON.parse(savedBeds);
          occupiedBeds = parsedBeds.filter((b) => b.isOccupied).length;
          setBeds(parsedBeds);
        }
        
        const emptyBeds = totalBeds - occupiedBeds;

        setStats({
          totalHostels,
          totalRooms,
          totalBeds,
          emptyBeds,
          occupiedBeds,
        });
      }
      if (savedRooms) {
        setRooms(JSON.parse(savedRooms));
      }
    };

    loadData();

    const handleHostelsUpdated = () => {
      loadData();
    };
    window.addEventListener("hostelsUpdated", handleHostelsUpdated);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "hostels" || e.key === "rooms" || e.key === "beds") {
        loadData();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("hostelsUpdated", handleHostelsUpdated);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const [selectedHostel, setSelectedHostel] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredRooms = rooms.filter((room) => {
    if (selectedHostel !== "all" && room.hostelId !== selectedHostel) return false;
    
    const roomBeds = beds.filter((b) => b.roomNumber === room.roomNumber && b.hostelId === room.hostelId);
    const occupiedCount = roomBeds.filter((b) => b.isOccupied).length;
    const totalBeds = room.capacity;

    if (selectedStatus === "empty") {
      // Show rooms that have space (not full)
      return occupiedCount < totalBeds;
    }
    if (selectedStatus === "occupied") {
      // Only show completely full rooms
      return occupiedCount >= totalBeds && totalBeds > 0;
    }
    return true;
  });

  const getRoomStatus = (room: Room) => {
    const roomBeds = beds.filter((b) => b.roomNumber === room.roomNumber && b.hostelId === room.hostelId);
    const occupiedCount = roomBeds.filter((b) => b.isOccupied).length;
    const totalBeds = room.capacity;

    if (occupiedCount >= totalBeds && totalBeds > 0) {
      return { label: "مصروف", color: "bg-red-50 border-red-200", textColor: "text-red-700", iconColor: "text-red-500" };
    } else {
      // Even if 1 bed is occupied, if there is space, it's 'Available/Empty' for your needs
      return { label: "خالی", color: "bg-emerald-50 border-emerald-200", textColor: "text-emerald-700", iconColor: "text-emerald-500" };
    }
  };

  return (
    <DashboardLayout title="ہاسٹل ڈیش بورڈ">
      <div className="space-y-6">
        {/* Orange Header with Stats */}
        <div className="bg-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white/20 p-3 rounded-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">ہاسٹل ڈیش بورڈ</h1>
              <p className="text-white/80 text-sm">ہاسٹل کے طلباء اور بیڈ الاٹمنٹ کی کل تفصیلات</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-3">
            <div className="bg-white/10 rounded-lg p-3 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-white/90">کل ہاسٹل</span>
                <Users className="h-4 w-4 text-white/80" />
              </div>
              <p className="text-2xl font-bold">{stats.totalHostels}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-white/90">کل کمرے</span>
                <DoorOpen className="h-4 w-4 text-white/80" />
              </div>
              <p className="text-2xl font-bold">{stats.totalRooms}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-white/90">کل بیڈز</span>
                <BedDouble className="h-4 w-4 text-white/80" />
              </div>
              <p className="text-2xl font-bold">{stats.totalBeds}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-white/90">خالی بیڈز</span>
                <Home className="h-4 w-4 text-white/80" />
              </div>
              <p className="text-2xl font-bold">{stats.emptyBeds}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-white/90">مصروف بیڈز</span>
                <Hotel className="h-4 w-4 text-white/80" />
              </div>
              <p className="text-2xl font-bold">{stats.occupiedBeds}</p>
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

          <div className="flex flex-wrap items-center gap-3 justify-between" dir="rtl">
            <Select value={selectedHostel} onValueChange={setSelectedHostel}>
              <SelectTrigger className="text-right border-gray-300 h-10 w-48">
                <SelectValue placeholder="تمام ہاسٹلز" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">تمام ہاسٹلز</SelectItem>
                {hostels.map((hostel) => (
                  <SelectItem key={hostel._id} value={hostel._id}>
                    {hostel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={selectedStatus === "all" ? "default" : "outline"}
                onClick={() => setSelectedStatus("all")}
                className={`px-6 h-10 ${selectedStatus === "all" ? "bg-emerald-800 hover:bg-emerald-900 text-white" : ""}`}
              >
                کل ({rooms.length})
              </Button>
              <Button
                variant={selectedStatus === "empty" ? "default" : "outline"}
                onClick={() => setSelectedStatus("empty")}
                className={`px-6 h-10 ${selectedStatus === "empty" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
              >
                خالی
              </Button>
              <Button
                variant={selectedStatus === "occupied" ? "default" : "outline"}
                onClick={() => setSelectedStatus("occupied")}
                className={`px-6 h-10 ${selectedStatus === "occupied" ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
              >
                مصروف
              </Button>
            </div>
          </div>
        </Card>

        {/* Room Cards */}
        <div className="grid grid-cols-5 gap-4">
          {filteredRooms.length === 0 ? (
            <div className="col-span-5 text-center py-8 text-gray-500">
              کوئی کمرہ نہیں ملا
            </div>
          ) : (
            filteredRooms.map((room) => {
              const status = getRoomStatus(room);
              const roomBeds = beds.filter((b) => b.roomNumber === room.roomNumber && b.hostelId === room.hostelId);
              const occupiedCount = roomBeds.filter((b) => b.isOccupied).length;
              const totalBeds = room.capacity;

              return (
                <Card
                  key={room._id}
                  className={`p-4 border-2 ${status.color} hover:shadow-md transition-shadow cursor-pointer`}
                >
                  <div className="flex items-start justify-between" dir="rtl">
                    <div className="text-2xl font-bold text-gray-700">{room.roomNumber}</div>
                    <DoorOpen className={`h-5 w-5 ${status.iconColor}`} />
                  </div>
                  <div className="mt-3">
                    <p className={`text-sm font-medium ${status.textColor}`}>{status.label}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {room.hostelName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {occupiedCount}/{totalBeds} بیڈز
                    </p>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
