import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../api/api.js";
import { logout } from "../features/auth/authSlice.js";

const nextStep = {
  NEW: { status: "ACCEPTED", label: "Accept order" },
  ACCEPTED: { status: "PREPARING", label: "Start preparing" },
  PREPARING: { status: "READY", label: "Mark ready" },
  READY: { status: "SERVED", label: "Mark served" },
};

function getWaitingTime(createdAt, now) {
  const createdTime = new Date(createdAt).getTime();
  if (!Number.isFinite(createdTime)) return "Waiting time unavailable";

  const elapsedMinutes = Math.max(0, Math.floor((now - createdTime) / 60000));
  if (elapsedMinutes === 0) return "Just arrived";

  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  if (hours > 0) return `Waiting ${hours}h ${minutes}m`;
  return `Waiting ${elapsedMinutes} min`;
}

function KitchenDashboard() {
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyOrderId, setBusyOrderId] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [refreshKey, setRefreshKey] = useState(0);

  const filteredOrders = useMemo(() => {
    const search = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;
      const matchesSearch =
        !search ||
        String(order.orderNumber ?? "").toLowerCase().includes(search) ||
        String(order.tableId?.table_Number ?? "").toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [orderSearch, orders, statusFilter]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const loadOrders = async () => {
      try {
        const response = await api.get("/orders/kitchen", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (isCurrent) {
          setOrders(response.data.orders || []);
          setError("");
          setLastUpdated(new Date());
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load kitchen orders."
          );
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadOrders();
    const intervalId = window.setInterval(loadOrders, 15000);

    return () => {
      isCurrent = false;
      window.clearInterval(intervalId);
    };
  }, [token, refreshKey]);

  const updateOrder = async (order) => {
    const action = nextStep[order.status];
    if (!action) return;

    setBusyOrderId(order._id);
    setError("");
    try {
      await api.patch(
        `/orders/${order._id}/status`,
        { status: action.status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to update this order."
      );
    } finally {
      setBusyOrderId("");
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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-5 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">
              resOS · Kitchen
            </p>
            <h1 className="mt-1 text-2xl font-bold">Incoming orders</h1>
            <p className="mt-1 text-sm text-slate-500">
              This screen checks for new orders every 15 seconds.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-6">
        {error && (
          <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
              Search table or order number
              <input
                type="search"
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
                placeholder="Enter table or order number"
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-600"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
              Filter by status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              >
                <option value="ALL">All active orders</option>
                <option value="NEW">New</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="PREPARING">Preparing</option>
                <option value="READY">Ready</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {(orderSearch || statusFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setOrderSearch("");
                  setStatusFilter("ALL");
                }}
                className="text-sm font-medium text-sky-700 hover:underline"
              >
                Clear filters
              </button>
            )}
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
              onClick={() => {
                setRefreshing(true);
                setRefreshKey((currentKey) => currentKey + 1);
              }}
              disabled={refreshing}
              className="rounded-lg bg-sky-700 px-4 py-2 font-semibold text-white hover:bg-sky-800 disabled:cursor-wait disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh orders"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-600">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <h2 className="text-xl font-semibold">No active orders</h2>
            <p className="mt-2 text-slate-500">
              New customer orders will appear here automatically.
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <h2 className="text-xl font-semibold">No orders match these filters</h2>
            <p className="mt-2 text-slate-500">
              Clear or change the search and status filters to see other orders.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredOrders.map((order) => {
              const action = nextStep[order.status];

              return (
                <article
                  key={order._id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">
                        Order #{order.orderNumber}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Table {order.tableId?.table_Number ?? "—"} ·{" "}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-600">
                        {getWaitingTime(order.createdAt, currentTime)}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                      {order.status}
                    </span>
                  </div>

                  <ul className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                    {order.items?.length ? (
                      order.items.map((item) => (
                        <li
                          key={item._id}
                          className="flex justify-between gap-3 text-sm"
                        >
                          <span className="font-medium">
                            {item.quantity} × {item.name}
                          </span>
                          <span className="text-slate-500">
                            ₹{Number(item.subtotal).toFixed(2)}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm leading-5 text-slate-500">
                        Item details are not included in the current kitchen API response.
                      </li>
                    )}
                  </ul>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="font-semibold">₹{Number(order.totalAmount).toFixed(2)}</span>
                    {action && (
                      <button
                        type="button"
                        onClick={() => updateOrder(order)}
                        disabled={busyOrderId === order._id}
                        className="rounded-lg bg-sky-700 px-4 py-2 font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
                      >
                        {busyOrderId === order._id ? "Updating..." : action.label}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default KitchenDashboard;
