import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/app/providers/auth-context';
import type { UserRoleValue } from '@/config';

export const GuestGuard = () => {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (user) {
        return user.is_setup_complete ? (
            <Navigate to="/" replace />
        ) : (
            <Navigate to="/setup-profile" replace />
        );
    }

    return <Outlet />;
};

export const AuthGuard = () => {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (!user) return <Navigate to="/login" replace />;
    if (!user.is_setup_complete) return <Navigate to="/setup-profile" replace />;

    return <Outlet />;
};

export const SetupGuard = () => {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (!user) return <Navigate to="/login" replace />;
    if (user.is_setup_complete) return <Navigate to="/" replace />;

    return <Outlet />;
};

interface RoleGuardProps {
    allowedRoles: readonly UserRoleValue[];
    children?: ReactNode;
}

export const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (!user || user.role == null || !allowedRoles.includes(user.role as UserRoleValue)) {
        return <Navigate to="/" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
