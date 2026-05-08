import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleProfile = () => {
    if (user?.role === "admin") {
      navigate("/settings");
      return;
    }
    navigate("/profile");
  };

  const displayName = user?.name || user?.username || "";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-6 shadow-sm">
      {/* Page Title */}
      <h1 className="text-xl font-bold text-foreground">{title}</h1>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-secondary-foreground">
                <User className="h-4 w-4" />
              </div>
              <span className="hidden sm:inline font-medium">{displayName || "صارف"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem className="cursor-pointer" onClick={handleProfile}>
              <User className="ml-2 h-4 w-4" />
              پروفائل
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-destructive" onClick={handleLogout}>
              <LogOut className="ml-2 h-4 w-4" />
              لاگ آؤٹ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
