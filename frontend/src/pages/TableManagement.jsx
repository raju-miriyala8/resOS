import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";
import api from "../api/api.js";

function TableManagement() {
  const { token, role } = useSelector((state) => state.auth);
  const dashboardPath = role === "OWNER" ? "/owner" : "/manager";

  const [tables, setTables] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedQR, setSelectedQR] = useState(null);
  const qrCodeRef = useRef(null);
  const isLocalhost = ["localhost", "127.0.0.1"].includes(
    window.location.hostname
  );

  const filteredTables = useMemo(() => {
    const search = tableSearch.trim();

    return tables.filter((table) => {
      const matchesNumber =
        !search || String(table.table_Number).includes(search);
      const matchesStatus =
        statusFilter === "ALL" || table.status === statusFilter;

      return matchesNumber && matchesStatus;
    });
  }, [statusFilter, tableSearch, tables]);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  useEffect(() => {
    let isCurrent = true;

    const loadTables = async () => {
      try {
        const response = await api.get("/tables", {
          headers: authHeaders,
        });

        if (isCurrent) {
          setTables(response.data.tables || []);
          setError("");
          setLastUpdated(new Date());
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(
            requestError.response?.data?.message || "Unable to load tables."
          );
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    if (token) loadTables();

    return () => {
      isCurrent = false;
    };
  }, [authHeaders, refreshKey, token]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRefreshKey((currentKey) => currentKey + 1);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleCreateTable = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const number = Number(tableNumber);

    if (!Number.isInteger(number) || number < 1) {
      setError("Enter a valid positive table number.");
      return;
    }

    setSaving(true);

    try {
      await api.post(
        "/tables",
        { table_Number: number },
        { headers: authHeaders }
      );

      setTableNumber("");
      setMessage("Table created successfully.");
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (error) {
      setError(
        error.response?.data?.message || "Unable to create table."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (tableId) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this table?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/tables/${tableId}`, {
        headers: authHeaders,
      });

      setMessage("Table deactivated successfully.");
      setSelectedQR(null);
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to deactivate table."
      );
    }
  };

  const getMenuUrl = (table) =>
    `${window.location.origin}/menu/${encodeURIComponent(table.qrToken)}`;

  const handleCopyMenuLink = async (table) => {
    setError("");
    setMessage("");

    try {
      await navigator.clipboard.writeText(getMenuUrl(table));
      setMessage(`Table ${table.table_Number} menu link copied.`);
    } catch {
      setError("Unable to copy the menu link. Check your browser clipboard permissions.");
    }
  };

  const handleDownloadQR = (table) => {
    const svg = qrCodeRef.current?.querySelector("svg");
    if (!svg) {
      setError("Unable to download this table's QR code.");
      return;
    }

    const svgFile = new Blob(
      [new XMLSerializer().serializeToString(svg)],
      { type: "image/svg+xml;charset=utf-8" }
    );
    const downloadUrl = URL.createObjectURL(svgFile);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `table-${table.table_Number}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-5 text-slate-800 md:p-10">
      <style>
        {`@media print {
          body * { visibility: hidden !important; }
          .qr-print-area, .qr-print-area * { visibility: visible !important; }
          .qr-print-area {
            position: absolute;
            inset: 0;
            display: flex !important;
            width: 100%;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white;
            padding: 2rem;
          }
        }`}
      </style>
      <div className="mx-auto max-w-6xl">
        <Link
          to={dashboardPath}
          className="text-sm font-medium text-sky-700 hover:underline"
        >
          ← Back to dashboard
        </Link>

        <header className="mb-8 mt-5">
          <h1 className="text-3xl font-bold">Table Management</h1>
          <p className="mt-2 text-slate-500">
            Create restaurant tables and manage their QR codes. Table status refreshes every 30 seconds.
          </p>
          {isLocalhost && (
            <p
              role="note"
              className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
            >
              Phone scanning will not work while this page is open on
              localhost. Open this page on your computer using its local
              network IP address first; the QR codes use the address shown in
              your browser.
            </p>
          )}
        </header>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Add a table</h2>

          <form
            onSubmit={handleCreateTable}
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="number"
              min="1"
              step="1"
              value={tableNumber}
              onChange={(event) => setTableNumber(event.target.value)}
              placeholder="Enter table number"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 sm:max-w-xs"
              required
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sky-700 px-5 py-3 font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Table"}
            </button>
          </form>
        </section>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p className="mb-4 rounded-lg bg-sky-50 p-4 text-sky-700">
            {message}
          </p>
        )}

        {loading ? (
          <p className="text-slate-500">Loading tables...</p>
        ) : tables.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500">
            No tables found. Create your first table above.
          </div>
        ) : (
          <>
            <section className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                  Search by table number
                  <input
                    type="search"
                    value={tableSearch}
                    onChange={(event) => setTableSearch(event.target.value)}
                    placeholder="Enter table number"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-600"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                  Status
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  >
                    <option value="ALL">All tables</option>
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-500">
                  Showing {filteredTables.length} of {tables.length}
                </p>
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
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTableSearch("");
                  setStatusFilter("ALL");
                }}
                disabled={!tableSearch && statusFilter === "ALL"}
                className="text-sm font-medium text-sky-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Clear filters
              </button>
            </section>

            {filteredTables.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                No tables match these filters.
              </p>
            ) : (
              <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTables.map((table) => (
              <article
                key={table._id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">
                      Table {table.table_Number}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      Status: {table.status}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      table.status === "Available"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {table.status}
                  </span>
                </div>

                <button
                  onClick={() =>
                    setSelectedQR(
                      selectedQR?._id === table._id ? null : table
                    )
                  }
                  className="mt-5 w-full rounded-lg border border-sky-700 px-4 py-2.5 font-medium text-sky-800 hover:bg-sky-50"
                >
                  {selectedQR?._id === table._id
                    ? "Hide QR Code"
                    : "Show QR Code"}
                </button>

                {selectedQR?._id === table._id && (
                  <div
                    ref={qrCodeRef}
                    className="qr-print-area mt-4 flex flex-col items-center rounded-lg bg-slate-50 p-4"
                  >
                    <h3 className="mb-3 text-lg font-bold">
                      Scan to order · Table {table.table_Number}
                    </h3>
                    <QRCodeSVG value={getMenuUrl(table)} size={200} level="H" includeMargin />

                    <p className="mt-3 max-w-full break-all text-center text-xs text-slate-600">
                      {getMenuUrl(table)}
                    </p>

                    <div className="print:hidden mt-4 grid w-full gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => handleCopyMenuLink(table)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-white"
                      >
                        Copy menu link
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadQR(table)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-white"
                      >
                        Download QR
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800"
                      >
                        Print QR
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleDeactivate(table._id)}
                  className="mt-3 w-full rounded-lg border border-red-200 px-4 py-2.5 font-medium text-red-600 hover:bg-red-50"
                >
                  Deactivate Table
                </button>
              </article>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TableManagement;
