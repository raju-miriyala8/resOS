import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import api from "../api/api.js";

const emptyForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  image: "",
};

function MenuManagement() {
  const { token, role } = useSelector((state) => state.auth);
  const dashboardPath = role === "OWNER" ? "/owner" : "/manager";

  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  useEffect(() => {
    let isCurrent = true;

    const loadItems = async () => {
      try {
        const response = await api.get("/menu", {
          headers: authHeaders,
        });

        if (isCurrent) {
          setItems(
            (response.data.menuItems || response.data.items || []).map((item) => ({
              ...item,
              isAvailable: item.is_Available ?? item.isAvailable ?? true,
            }))
          );
          setLastUpdated(new Date());
          setError("");
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load menu items."
          );
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    if (token) loadItems();

    return () => {
      isCurrent = false;
    };
  }, [authHeaders, refreshKey, token]);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))].sort(),
    [items]
  );

  const filteredItems = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch = [
        item.name,
        item.category,
        item.description,
      ].some((value) => value?.toLowerCase().includes(search));
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && item.isAvailable) ||
        (availabilityFilter === "unavailable" && !item.isAvailable);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [availabilityFilter, items, searchText, selectedCategory]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const price = Number(form.price);

    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid non-negative price.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        price,
      };

      if (editingId) {
        await api.put(`/menu/${editingId}`, payload, {
          headers: authHeaders,
        });

        setMessage("Menu item updated successfully.");
      } else {
        await api.post("/menu", payload, {
          headers: authHeaders,
        });

        setMessage("Menu item added successfully.");
      }

      resetForm();
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to save menu item."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);

    setForm({
      name: item.name || "",
      description: item.description || "",
      category: item.category || "",
      price: String(item.price ?? ""),
      image: item.image || "",
    });

    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAvailability = async (item) => {
    if (updatingItemId) return;

    setError("");
    setMessage("");
    setUpdatingItemId(item._id);

    try {
      await api.put(
        `/menu/${item._id}`,
        {
          name: item.name,
          description: item.description || "",
          category: item.category || "",
          price: item.price,
          image: item.image || "",
          isAvailable: !item.isAvailable,
        },
        { headers: authHeaders }
      );

      setMessage("Item availability updated.");
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to update availability."
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleDeactivate = async (item) => {
    if (updatingItemId) return;

    if (!window.confirm(`Deactivate "${item.name}"?`)) {
      return;
    }

    setError("");
    setMessage("");
    setUpdatingItemId(item._id);

    try {
      await api.patch(`/menu/${item._id}`, {}, {
        headers: authHeaders,
      });

      if (editingId === item._id) {
        resetForm();
      }

      setMessage("Menu item deactivated.");
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to deactivate item."
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-5 text-slate-800 md:p-10">
      <div className="mx-auto max-w-6xl">
        <Link
          to={dashboardPath}
          className="text-sm font-medium text-sky-700 hover:underline"
        >
          ← Back to dashboard
        </Link>

        <header className="mb-8 mt-5">
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="mt-2 text-slate-500">
            Manage dishes, prices, and item availability.
          </p>
        </header>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            {editingId ? "Edit Menu Item" : "Add Menu Item"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Item name"
              className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-sky-600"
              required
            />

            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Category (e.g. Main Course)"
              className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-sky-600"
              required
            />

            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              placeholder="Price in ₹"
              className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-sky-600"
              required
            />

            <input
              name="image"
              type="url"
              value={form.image}
              onChange={handleChange}
              placeholder="Image URL (optional)"
              className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-sky-600"
            />

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description"
              rows={3}
              className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-sky-600 sm:col-span-2"
              required
            />

            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-sky-700 px-5 py-3 font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Add Menu Item"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-300 px-5 py-3 hover:bg-slate-50"
                >
                  Cancel Edit
                </button>
              )}
            </div>
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

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Your Menu</h2>
              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredItems.length} of {items.length} menu items
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
                onClick={() => {
                  setError("");
                  setRefreshing(true);
                  setRefreshKey((currentKey) => currentKey + 1);
                }}
                disabled={refreshing}
                className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-wait disabled:opacity-50"
              >
                {refreshing ? "Refreshing..." : "Refresh menu"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchText("");
                  setSelectedCategory("all");
                  setAvailabilityFilter("all");
                }}
                disabled={
                  !searchText &&
                  selectedCategory === "all" &&
                  availabilityFilter === "all"
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear filters
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-500">Loading menu...</p>
          ) : items.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center text-slate-500">
              No menu items found. Add your first item above.
            </div>
          ) : (
            <>
              <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
                <input
                  type="search"
                  aria-label="Search menu items"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search name, category, or description"
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 sm:col-span-3"
                />
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                  Category
                  <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-sky-600"
                  >
                    <option value="all">All categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                  Availability
                  <select
                    value={availabilityFilter}
                    onChange={(event) => setAvailabilityFilter(event.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-sky-600"
                  >
                    <option value="all">All items</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </label>
              </div>

              {filteredItems.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                  No menu items match these filters.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map((item) => (
                <article
                  key={item._id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-44 w-full object-cover"
                    />
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.category}
                        </p>
                      </div>

                      <span className="whitespace-nowrap font-bold text-sky-800">
                        ₹{Number(item.price).toFixed(2)}
                      </span>
                    </div>

                    {item.description && (
                      <p className="mt-3 text-sm text-slate-600">
                        {item.description}
                      </p>
                    )}

                    <p
                      className={`mt-4 text-sm font-medium ${
                        item.isAvailable
                          ? "text-sky-700"
                          : "text-amber-700"
                      }`}
                    >
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        disabled={updatingItemId !== null}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleAvailability(item)}
                        disabled={updatingItemId !== null}
                        className="rounded-lg border border-sky-200 px-3 py-2 text-sm text-sky-800 hover:bg-sky-50 disabled:cursor-wait disabled:opacity-50"
                      >
                        {updatingItemId === item._id
                          ? "Updating..."
                          : item.isAvailable
                            ? "Mark Unavailable"
                            : "Mark Available"}
                      </button>

                      <button
                        onClick={() => handleDeactivate(item)}
                        disabled={updatingItemId !== null}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
                      >
                        {updatingItemId === item._id
                          ? "Updating..."
                          : "Deactivate"}
                      </button>
                    </div>
                  </div>
                </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default MenuManagement;
