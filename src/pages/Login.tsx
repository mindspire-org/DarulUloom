import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { PasswordInput } from "@/components/shared/PasswordInput";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const logoSrc = `${import.meta.env.BASE_URL}brand-logo.jpg`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await login(username, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shadow-lg overflow-hidden">
              <img
                src={logoSrc}
                alt="Jamia"
                className="h-full w-full object-contain mix-blend-multiply"
              />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">جامعہ داخلہ نظام</CardTitle>
            <p className="text-muted-foreground mt-2">
              Madrasa Admission System
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-base">
                صارف نام
              </Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="اپنا صارف نام درج کریں"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pr-10 h-12 text-base"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">
                پاس ورڈ
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                <PasswordInput
                  id="password"
                  placeholder="اپنا پاس ورڈ درج کریں"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 h-12 text-base"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "لاگ ان ہو رہا ہے..." : "لاگ ان"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
