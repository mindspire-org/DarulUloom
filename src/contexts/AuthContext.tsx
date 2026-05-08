import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authAPI } from "@/lib/api";

export type UserRole = "admin" | "counter1" | "counter2";

export interface User {
    id: string;
    username: string;
    name: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    updateUser: (nextUser: User) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        if (storedUser && storedUser !== "undefined" && storedToken) {
            try {
                return JSON.parse(storedUser);
            } catch (e) {
                console.error("Auth: Failed to parse user from localStorage", e);
            }
        }
        return null;
    });
    const navigate = useNavigate();

    useEffect(() => {
        // Just verify if session is still valid
        const storedToken = localStorage.getItem("token");
        if (storedToken && !user) {
            // This case shouldn't happen with lazy state initialization, 
            // but keeping it for safety
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {}
            }
        }
    }, [user]);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            // Call backend API
            const response = await authAPI.login(username, password);
            const { token, user: userData } = response.data;

            // Store token and user data
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);

            // Navigate based on role
            if (userData.role === "admin") {
                navigate("/dashboard");
            } else if (userData.role === "counter1") {
                navigate("/token-counter");
            } else if (userData.role === "counter2") {
                navigate("/verification");
            }

            toast.success(`خوش آمدید ${userData.name}`);
            return true;
        } catch (error: any) {
            const message = error.response?.data?.message || "غلط صارف نام یا پاس ورڈ";
            toast.error(message);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/login");
        toast.success("آپ لاگ آؤٹ ہو گئے ہیں");
    };

    const updateUser = (nextUser: User) => {
        setUser(nextUser);
        localStorage.setItem("user", JSON.stringify(nextUser));
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                updateUser,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
