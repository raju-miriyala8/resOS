import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api.js";
import { logout } from "../features/auth/authSlice.js";

const dashboardCards = [
  {
    title: "Orders today",
    value: "todayOrders",
    description: "Orders received today",
  },
  {
    title: "Tables available",
    value: "availableTables",
    description: "Ready for the next guests",
  },
  {
    title: "Tables occupied",
    value: "occupiedTables",
    description: "Currently in use",
  },
  {
    title: "Active staff",
    value: "activeStaff",
    description: "Staff enabled for this restaurant",
  },
  {
    title: "Menu items",
    value: "totalMenuItems",
    description: "Active items on your menu",
  },
];

function ManagerDashboard() {
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    let requestInProgress = false;

    const fetchDashboard = async () => {
      if (requestInProgress) return;
      requestInProgress = true;
      if (isCurrent) setRefreshing(true);

      try {
        const response = await api.get("/dashboard/manager", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (isCurrent) {
          setDashboard(response.data.dashboard);
          setLastUpdated(new Date());
          setError("");
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load manager dashboard."
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
      fetchDashboard();
      const intervalId = window.setInterval(fetchDashboard, 30000);

      return () => {
        isCurrent = false;
        window.clearInterval(intervalId);
      };
    }

    return () => {
      isCurrent = false;
    };
  }, [refreshKey, token]);

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
        Loading dashboard...
      </main>
    );
  }

  if (error && !dashboard) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section className="max-w-lg rounded-xl border border-red-200 bg-white p-6">
          <h1 className="text-lg font-semibold text-red-800">
            Dashboard could not load
          </h1>
          <p role="alert" className="mt-2 text-red-700">
            {error}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError("");
              setRefreshKey((currentKey) => currentKey + 1);
            }}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="ml-3 mt-4 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign in again
          </button>
        </section>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="p-8 text-slate-600">No dashboard data available.</main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <aside className="bg-slate-950 p-6 text-white md:min-h-screen md:w-64 md:shrink-0">
        <Link
          to="/manager"
          className="text-2xl font-bold tracking-tight text-sky-300"
        >
          resOS
        </Link>

        <p className="mb-3 mt-9 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Manager workspace
        </p>

        <nav
          aria-label="Manager navigation"
          className="flex flex-wrap gap-2 md:flex-col"
        >
          <Link
            to="/manager"
            aria-current="page"
            className="rounded-lg bg-slate-800 px-4 py-3 font-medium"
          >
            Dashboard
          </Link>
          <Link
            to="/tables"
            className="rounded-lg px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Tables & QR codes
          </Link>
          <Link
            to="/menu-management"
            className="rounded-lg px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Menu management
          </Link>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
              Restaurant overview
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Good service starts here.
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              A quick look at today&apos;s restaurant operations.
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
              className="rounded-lg bg-sky-700 px-4 py-2.5 font-semibold text-white transition hover:bg-sky-800 disabled:cursor-wait disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh dashboard"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium transition hover:bg-slate-100"
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

        <section
          aria-label="Restaurant metrics"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {dashboardCards.map((card) => (
            <article
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <h2 className="my-3 text-4xl font-bold tabular-nums text-slate-900">
                {dashboard[card.value] ?? 0}
              </h2>
              <p className="text-sm text-slate-500">{card.description}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Orders by status</h2>
            <p className="mt-1 text-sm text-slate-500">
              Current order counts from your restaurant.
            </p>

            {dashboard.orderStatuses?.length > 0 ? (
              <ul className="mt-4 divide-y divide-slate-100">
                {dashboard.orderStatuses.map((item) => (
                  <li
                    key={item._id}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="capitalize text-slate-700">
                      {item._id?.toLowerCase() || "Unknown"}
                    </span>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
                      {item.count}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                No order status data yet.
              </p>
            )}
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Quick actions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Jump to the tools you use during a shift.
            </p>
            <div className="mt-5 grid gap-3">
              <Link
                to="/tables"
                className="rounded-lg bg-sky-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-sky-800"
              >
                Manage tables and QR codes
              </Link>
              <Link
                to="/menu-management"
                className="rounded-lg border border-slate-300 px-4 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Update the menu
              </Link>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default ManagerDashboard;
