import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api.js";
import { logout } from "../features/auth/authSlice.js";

function OwnerDashboard() {
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [staff, setStaff] = useState([]);
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("MANAGER");
  const [staffSearch, setStaffSearch] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("ALL");
  const [managerPassword, setManagerPassword] = useState("");
  const [kitchenPassword, setKitchenPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [savingStaff, setSavingStaff] = useState(false);
  const [savingPassword, setSavingPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const filteredStaff = useMemo(() => {
    const search = staffSearch.trim().toLowerCase();

    return staff.filter((member) => {
      const matchesName = member.name?.toLowerCase().includes(search);
      const matchesRole =
        staffRoleFilter === "ALL" || member.role === staffRoleFilter;

      return matchesName && matchesRole;
    });
  }, [staff, staffRoleFilter, staffSearch]);

  useEffect(() => {
    let isCurrent = true;
    let requestInProgress = false;

    const loadOwnerDashboard = async () => {
      if (requestInProgress) return;
      requestInProgress = true;
      if (isCurrent) setRefreshing(true);

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [dashboardResponse, staffResponse] =
          await Promise.all([
            api.get("/dashboard/owner", { headers }),
            api.get("/staff", { headers }),
          ]);

        if (isCurrent) {
          setDashboard(dashboardResponse.data.dashboard);
          setStaff(staffResponse.data.staff || []);
          setLastUpdated(new Date());
          setError("");
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load owner dashboard."
          );
        }
      } finally {
        requestInProgress = false;
        if (isCurrent) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    if (token) {
      loadOwnerDashboard();
      const intervalId = window.setInterval(loadOwnerDashboard, 30000);

      return () => {
        isCurrent = false;
        window.clearInterval(intervalId);
      };
    }

    return () => {
      isCurrent = false;
    };
  }, [refreshKey, token]);

  const clearNotices = () => {
    setError("");
    setMessage("");
  };

  const handleCreateStaff = async (event) => {
    event.preventDefault();
    clearNotices();
    setSavingStaff(true);

    try {
      const response = await api.post(
        "/staff",
        { name: staffName, role: staffRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStaff((currentStaff) => [response.data.staff, ...currentStaff]);
      setStaffName("");
      setMessage("Staff record added.");
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to add staff record."
      );
    } finally {
      setSavingStaff(false);
    }
  };

  const handleDeactivateStaff = async (staffId) => {
    clearNotices();
    try {
      await api.patch(
        `/staff/${staffId}/deactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStaff((currentStaff) =>
        currentStaff.filter((member) => member._id !== staffId)
      );
      setMessage("Staff record deactivated.");
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to deactivate staff record."
      );
    }
  };

  const handleCreateRolePassword = async (event, role) => {
    event.preventDefault();
    clearNotices();
    setSavingPassword(role);

    const isManager = role === "MANAGER";
    const password = isManager ? managerPassword : kitchenPassword;
    const endpoint = isManager
      ? "/auth/create-manager-password"
      : "/auth/create-kitchen-password";
    const payload = isManager
      ? { managerPassword: password }
      : { kitchenPassword: password };

    try {
      await api.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (isManager) setManagerPassword("");
      else setKitchenPassword("");
      setMessage(`${role === "MANAGER" ? "Manager" : "Kitchen"} password created.`);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          `Unable to create ${role.toLowerCase()} password.`
      );
    } finally {
      setSavingPassword("");
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("restaurantToken");
    localStorage.removeItem("resosToken");
    localStorage.removeItem("restaurantId");
    localStorage.removeItem("role");
    navigate("/");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading owner dashboard...
      </main>
    );
  }

  if (error && !dashboard) {
    return (
      <main className="p-8">
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setError("");
            setRefreshKey((currentKey) => currentKey + 1);
          }}
          className="mt-4 rounded-lg bg-sky-700 px-4 py-2 font-semibold text-white hover:bg-sky-800"
        >
          Try again
        </button>
      </main>
    );
  }

  if (!dashboard) {
    return <main className="p-8 text-slate-600">No dashboard data available.</main>;
  }

  const cards = [
    {
      title: "Active staff records",
      value: dashboard.activeStaff ?? 0,
      description: `${dashboard.totalStaff ?? 0} total records`,
    },
    {
      title: "Available tables",
      value: dashboard.availableTables ?? 0,
      description: `${dashboard.occupiedTables ?? 0} currently occupied`,
    },
    {
      title: "Active menu items",
      value: dashboard.totalMenuItems ?? 0,
      description: "Items currently listed",
    },
    {
      title: "Orders today",
      value: dashboard.todayOrders ?? 0,
      description: "Orders received today",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <aside className="bg-slate-950 p-6 text-white md:min-h-screen md:w-64 md:shrink-0">
        <Link to="/owner" className="text-2xl font-bold text-sky-300">
          resOS
        </Link>
        <p className="mb-3 mt-9 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Owner workspace
        </p>
        <nav aria-label="Owner navigation" className="flex flex-wrap gap-2 md:flex-col">
          <a href="#overview" className="rounded-lg bg-slate-800 px-4 py-3 font-medium">
            Overview
          </a>
          <a href="#team" className="rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-800">
            Staff & access
          </a>
          <Link to="/tables" className="rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-800">
            Tables & QR codes
          </Link>
          <Link to="/menu-management" className="rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-800">
            Menu management
          </Link>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">
        <header id="overview" className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
              Restaurant overview
            </p>
            <h1 className="mt-2 text-3xl font-bold">Owner dashboard</h1>
            <p className="mt-2 text-sm text-slate-500">
              Operational counts available from your current backend.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {lastUpdated && (
              <p className="text-xs text-slate-500">
                Updated{" "}
                {lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </p>
            )}
            <button
              type="button"
              onClick={() => setRefreshKey((currentKey) => currentKey + 1)}
              disabled={refreshing}
              className="rounded-lg bg-sky-700 px-4 py-2.5 font-semibold text-white hover:bg-sky-800 disabled:cursor-wait disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh overview"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </header>

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
            {error} The dashboard is showing the last successfully loaded data.
          </p>
        )}

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mb-4 rounded-lg bg-sky-50 p-4 text-sky-800">
            {message}
          </p>
        )}

        <section aria-label="Restaurant metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <article key={card.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <p className="my-3 text-4xl font-bold tabular-nums">{card.value}</p>
              <p className="text-sm text-slate-500">{card.description}</p>
            </article>
          ))}
        </section>

        <section id="team" className="mt-7 grid gap-5 xl:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Role access passwords</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              One shared password is used for each role. Staff records below are
              a directory and do not create individual logins.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                {
                  role: "MANAGER",
                  label: "Manager password",
                  value: managerPassword,
                  setValue: setManagerPassword,
                },
                {
                  role: "KITCHEN",
                  label: "Kitchen password",
                  value: kitchenPassword,
                  setValue: setKitchenPassword,
                },
              ].map((item) => (
                <form
                  key={item.role}
                  onSubmit={(event) => handleCreateRolePassword(event, item.role)}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{item.label}</h3>
                    <span className="text-xs font-semibold text-slate-500">
                      Shared access
                    </span>
                  </div>
                  <input
                    type="password"
                    value={item.value}
                    onChange={(event) => item.setValue(event.target.value)}
                    placeholder="At least 6 characters"
                    minLength={6}
                    autoComplete="new-password"
                    className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-600"
                    required
                  />
                  <button
                    type="submit"
                    disabled={savingPassword === item.role}
                    className="mt-3 w-full rounded-lg bg-sky-700 px-3 py-2 font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
                  >
                    {savingPassword === item.role ? "Saving..." : "Create password"}
                  </button>
                </form>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Staff directory</h2>
            <p className="mt-1 text-sm text-slate-500">
              Add active staff records or deactivate people who have left.
            </p>

            <form onSubmit={handleCreateStaff} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={staffName}
                onChange={(event) => setStaffName(event.target.value)}
                placeholder="Staff member name"
                aria-label="Staff member name"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-600"
                required
              />
              <select
                value={staffRole}
                onChange={(event) => setStaffRole(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="MANAGER">Manager</option>
                <option value="KITCHEN">Kitchen</option>
              </select>
              <button
                type="submit"
                disabled={savingStaff}
                className="rounded-lg bg-sky-700 px-4 py-2 font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
              >
                {savingStaff ? "Adding..." : "Add staff"}
              </button>
            </form>

            <div className="mt-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-500">
                  Showing {filteredStaff.length} of {staff.length} staff members
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStaffSearch("");
                    setStaffRoleFilter("ALL");
                  }}
                  disabled={!staffSearch && staffRoleFilter === "ALL"}
                  className="text-sm font-medium text-sky-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  Clear filters
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="search"
                  aria-label="Search staff by name"
                  value={staffSearch}
                  onChange={(event) => setStaffSearch(event.target.value)}
                  placeholder="Search staff by name"
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-600"
                />
                <select
                  aria-label="Filter staff by role"
                  value={staffRoleFilter}
                  onChange={(event) => setStaffRoleFilter(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="ALL">All roles</option>
                  <option value="MANAGER">Manager</option>
                  <option value="KITCHEN">Kitchen</option>
                </select>
              </div>
            </div>

            {staff.length === 0 ? (
              <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                No active staff records yet.
              </p>
            ) : filteredStaff.length === 0 ? (
              <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                No staff members match these filters.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {filteredStaff.map((member) => (
                  <li key={member._id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeactivateStaff(member._id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Deactivate
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Order status overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Current counts grouped by order status (not revenue).
          </p>
          {dashboard.orderStatuses?.length ? (
            <ul className="mt-3 flex flex-wrap gap-3">
              {dashboard.orderStatuses.map((item) => (
                <li key={item._id} className="rounded-lg bg-slate-50 px-4 py-3">
                  <span className="capitalize text-slate-600">{item._id.toLowerCase()}</span>
                  <span className="ml-3 font-bold">{item.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No orders recorded yet.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default OwnerDashboard;
