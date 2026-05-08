import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate page based on role
        if (user.role === "admin") {
            return <Navigate to="/dashboard" replace />;
        } else if (user.role === "counter1") {
            return <Navigate to="/token-counter" replace />;
        } else if (user.role === "counter2") {
            return <Navigate to="/verification" replace />;
        }
    }

    return <>{children}</>;
}
