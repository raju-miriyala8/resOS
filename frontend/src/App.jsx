import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import RoleSelection from "./pages/RoleSelection.jsx";
import VerifyRole from "./pages/VerifyRole.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import OwnerDashboard from "./pages/ownerDashboard.jsx";
import ManagerDashboard from "./pages/ManagerDashboard.jsx";
import TableManagement from "./pages/TableManagement.jsx";
import MenuManagement from "./pages/MenuManagement.jsx";
import CustomerMenu from "./pages/CustomerMenu.jsx";
import KitchenDashboard from "./pages/KitchenDashboard.jsx";
import RegisterRestaurant from "./pages/RegisterRestaurant.jsx";
import PlatformAdminLogin from "./pages/PlatformAdminLogin.jsx";
import PlatformAdminDashboard from "./pages/PlatformAdminDashboard.jsx";
import PlatformAdminRoute from "./components/PlatformAdminRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<RegisterRestaurant />} />
        <Route path="/platform-admin" element={<PlatformAdminLogin />} />
        <Route element={<PlatformAdminRoute />}>
          <Route
            path="/platform-admin/restaurants"
            element={<PlatformAdminDashboard />}
          />
        </Route>
        <Route path="/menu/:qrToken" element={<CustomerMenu />} />

        <Route element={<ProtectedRoute requireRole={false} />}>
          <Route path="/select-role" element={<RoleSelection />} />
          <Route path="/verify-role" element={<VerifyRole />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} />}>
          <Route path="/manager" element={<ManagerDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["KITCHEN"]} />}>
          <Route path="/kitchen" element={<KitchenDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["OWNER"]} />}>
          <Route path="/owner" element={<OwnerDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["OWNER", "MANAGER"]} />}>
          <Route path="/tables" element={<TableManagement />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["OWNER", "MANAGER"]} />}>
          <Route path="/menu-management" element={<MenuManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
