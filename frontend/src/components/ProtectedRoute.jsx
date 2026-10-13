import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute({ allowedRoles = [], requireRole = true }) {
  const { token, role } = useSelector((state) => state.auth);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (requireRole && !role) {
    return <Navigate to="/select-role" replace />;
  }

  if (requireRole && !allowedRoles.includes(role)) {
    return <Navigate to="/select-role" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
