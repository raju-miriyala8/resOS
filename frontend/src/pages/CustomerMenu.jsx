import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api.js";

const orderProgressSteps = [
  { status: "NEW", label: "Order received" },
  { status: "ACCEPTED", label: "Accepted by kitchen" },
  { status: "PREPARING", label: "Preparing" },
  { status: "READY", label: "Ready to serve" },
  { status: "SERVED", label: "Served" },
];

function CustomerMenu() {
  const { qrToken } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const [tableNumber, setTableNumber] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [quantities, setQuantities] = useState({});
  const [menuSearch, setMenuSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [orders, setOrders] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [orderStatusError, setOrderStatusError] = useState("");
  const [cartStorageError, setCartStorageError] = useState("");
  const [ordersStorageReady, setOrdersStorageReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const activeOrderIds = orders
    .filter((order) => !["SERVED", "CANCELLED"].includes(order.status))
    .map((order) => order._id)
    .join(",");

  const categories = useMemo(
    () => [...new Set(menuItems.map((item) => item.category).filter(Boolean))].sort(),
    [menuItems]
  );

  const visibleMenuItems = useMemo(() => {
    const search = menuSearch.trim().toLowerCase();

    return menuItems.filter((item) => {
      const matchesSearch = [item.name, item.category, item.description].some(
        (value) => value?.toLowerCase().includes(search)
      );
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [menuItems, menuSearch, selectedCategory]);

  const saveOrderSummaries = useCallback(
    (ordersToSave, activeSessionId = sessionId) => {
      if (!activeSessionId || !ordersStorageReady) return "";

      try {
        const storageKey = `resos-orders-${activeSessionId}`;
        const savedOrders = JSON.parse(
          sessionStorage.getItem(storageKey) || "[]"
        );
        const summariesById = new Map(
          savedOrders.map((order) => [order._id, order])
        );

        ordersToSave.forEach(({ _id, orderNumber, totalAmount, status }) => {
          summariesById.set(_id, { _id, orderNumber, totalAmount, status });
        });
        sessionStorage.setItem(
          storageKey,
          JSON.stringify([...summariesById.values()])
        );
        return "";
      } catch {
        return "Order tracking could not be saved in this browser tab. Keep this page open to follow your orders.";
      }
    },
    [ordersStorageReady, sessionId]
  );

  const saveDraftCart = (nextQuantities, activeSessionId = sessionId) => {
    if (!activeSessionId || !ordersStorageReady) return "";

    try {
      const storageKey = `resos-cart-${activeSessionId}`;
      if (Object.keys(nextQuantities).length === 0) {
        sessionStorage.removeItem(storageKey);
      } else {
        sessionStorage.setItem(storageKey, JSON.stringify(nextQuantities));
      }
      return "";
    } catch {
      return "Your draft cart could not be saved in this browser tab.";
    }
  };

  useEffect(() => {
    if (!activeOrderIds) return undefined;

    let isCurrent = true;
    const orderIds = activeOrderIds.split(",");

    const refreshOrderStatuses = async () => {
      const results = await Promise.allSettled(
        orderIds.map((orderId) =>
          api.get(`/orders/customer/${encodeURIComponent(orderId)}`)
        )
      );

      if (!isCurrent) return;

      const updatedOrders = new Map();
      let hasError = false;

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          updatedOrders.set(result.value.data.order._id, result.value.data.order);
        } else {
          hasError = true;
        }
      });

      setOrders((currentOrders) =>
        currentOrders.map((order) => updatedOrders.get(order._id) || order)
      );
      const storageError = saveOrderSummaries([...updatedOrders.values()]);
      setOrderStatusError(
        hasError
          ? "Unable to refresh one or more order statuses. Retrying shortly."
          : storageError
      );
    };

    refreshOrderStatuses();
    const intervalId = window.setInterval(refreshOrderStatuses, 10000);

    return () => {
      isCurrent = false;
      window.clearInterval(intervalId);
    };
  }, [activeOrderIds, saveOrderSummaries]);

  useEffect(() => {
    let isCurrent = true;

    const loadMenu = async () => {
      try {
        const menuResponse = await api.get(
          `/menu/customer/${encodeURIComponent(qrToken)}`
        );
        const sessionResponse = await api.post("/table-sessions", { qrToken });

        if (!sessionResponse.data.session?._id) {
          throw new Error("Unable to start a table session.");
        }

        if (isCurrent) {
          const activeSessionId = sessionResponse.data.session._id;
          let savedOrders = [];
          let savedQuantities = {};

          try {
            const savedOrdersJson = sessionStorage.getItem(
              `resos-orders-${activeSessionId}`
            );
            if (savedOrdersJson) {
              const parsedOrders = JSON.parse(savedOrdersJson);
              if (!Array.isArray(parsedOrders)) {
                throw new Error("Saved order history is invalid.");
              }

              savedOrders = parsedOrders.filter(
                (order) =>
                  typeof order?._id === "string" &&
                  Number.isFinite(Number(order.totalAmount))
              );
            }
          } catch {
            setOrderStatusError(
              "Saved order history could not be restored. New orders will still work."
            );
          }

          const availableMenuItems = menuResponse.data.menuItems || [];

          try {
            const savedCartJson = sessionStorage.getItem(
              `resos-cart-${activeSessionId}`
            );

            if (savedCartJson) {
              const parsedCart = JSON.parse(savedCartJson);
              if (
                !parsedCart ||
                typeof parsedCart !== "object" ||
                Array.isArray(parsedCart)
              ) {
                throw new Error("Saved cart is invalid.");
              }

              const menuItemIds = new Set(
                availableMenuItems.map((item) => item._id)
              );
              savedQuantities = Object.fromEntries(
                Object.entries(parsedCart).filter(
                  ([itemId, quantity]) =>
                    menuItemIds.has(itemId) &&
                    Number.isInteger(quantity) &&
                    quantity > 0
                )
              );
            }
          } catch {
            setCartStorageError(
              "Your saved cart could not be restored. You can still place a new order."
            );
          }

          setMenuItems(availableMenuItems);
          setTableNumber(menuResponse.data.tableNumber);
          setOrders(savedOrders);
          setQuantities(savedQuantities);
          setSessionId(activeSessionId);
          setOrdersStorageReady(true);
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Unable to load this table's menu."
          );
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadMenu();

    return () => {
      isCurrent = false;
    };
  }, [qrToken]);

  const cart = useMemo(
    () =>
      menuItems
        .map((item) => ({
          ...item,
          quantity: quantities[item._id] || 0,
        }))
        .filter((item) => item.quantity > 0),
    [menuItems, quantities]
  );

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const changeQuantity = (itemId, change) => {
    const nextQuantity = Math.max(0, (quantities[itemId] || 0) + change);
    const nextQuantities = { ...quantities, [itemId]: nextQuantity };

    if (nextQuantity === 0) delete nextQuantities[itemId];

    setQuantities(nextQuantities);
    setCartStorageError(saveDraftCart(nextQuantities));
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    if (cart.length === 0) return;

    setError("");
    setSubmitting(true);

    try {
      const response = await api.post("/orders", {
        qrToken,
        items: cart.map((item) => ({
          menuItemId: item._id,
          quantity: item.quantity,
        })),
      });

      const nextOrders = [...orders, response.data.order];
      setOrders(nextOrders);
      setOrderStatusError(saveOrderSummaries([response.data.order]));
      setQuantities({});
      setCartStorageError(saveDraftCart({}));
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to place your order."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-600">
        Loading this table&apos;s menu...
      </main>
    );
  }

  if (error && menuItems.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
        <section className="max-w-md rounded-2xl border border-stone-200 bg-white p-7 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-stone-900">Menu unavailable</h1>
          <p role="alert" className="mt-3 text-stone-600">{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-5 py-6">
        <div className="mx-auto flex max-w-5xl items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">resOS menu</p>
            <h1 className="mt-2 text-3xl font-bold">Order for your table</h1>
          </div>
          {tableNumber !== null && (
            <p className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800">
              Table {tableNumber}
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-7 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold">Today&apos;s menu</h2>
            {menuItems.length > 0 && (
              <p className="mt-1 text-sm text-stone-500">
                Showing {visibleMenuItems.length} of {menuItems.length} dishes
              </p>
            )}
          </div>

          {menuItems.length === 0 ? (
            <p className="rounded-xl border border-stone-200 bg-white p-6 text-stone-600">
              There are no available items right now. Please ask a staff member for help.
            </p>
          ) : (
            <>
              <div className="mb-4 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                  Search dishes
                  <input
                    type="search"
                    value={menuSearch}
                    onChange={(event) => setMenuSearch(event.target.value)}
                    placeholder="Name or description"
                    className="rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                  Category
                  <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-sky-600"
                  >
                    <option value="all">All categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                {(menuSearch || selectedCategory !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuSearch("");
                      setSelectedCategory("all");
                    }}
                    className="justify-self-start text-sm font-medium text-sky-700 hover:underline sm:col-span-2"
                  >
                    Clear menu filters
                  </button>
                )}
              </div>

              {visibleMenuItems.length === 0 ? (
                <p className="rounded-xl border border-stone-200 bg-white p-6 text-center text-stone-600">
                  No dishes match your search. Try a different term or category.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {visibleMenuItems.map((item) => (
                <article
                  key={item._id}
                  className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                        {item.category}
                      </p>
                      <h3 className="mt-1 text-lg font-bold">{item.name}</h3>
                    </div>
                    <span className="whitespace-nowrap font-semibold">
                      ₹{Number(item.price).toFixed(2)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-sm text-stone-500">Quantity</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label={`Remove one ${item.name}`}
                        onClick={() => changeQuantity(item._id, -1)}
                        disabled={!quantities[item._id]}
                        className="h-9 w-9 rounded-full border border-stone-300 font-semibold disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="min-w-5 text-center font-semibold">
                        {quantities[item._id] || 0}
                      </span>
                      <button
                        type="button"
                        aria-label={`Add one ${item.name}`}
                        onClick={() => changeQuantity(item._id, 1)}
                        className="h-9 w-9 rounded-full bg-sky-700 font-semibold text-white hover:bg-sky-800"
                      >
                        +
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

        <aside className="h-fit rounded-xl border border-stone-200 bg-white p-5 shadow-sm lg:sticky lg:top-5">
          {orders.length > 0 && (
            <section aria-live="polite">
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
                Order updates
              </p>
              <h2 className="mt-2 text-xl font-bold">Orders for your table</h2>
              <p className="mt-1 text-sm text-stone-500">
                Orders stay listed if you refresh this page in the same tab.
              </p>
              {orderStatusError && (
                <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {orderStatusError}
                </p>
              )}
              <ul className="mt-4 space-y-3">
                {orders.map((order) => (
                  <li
                    key={order._id}
                    className="rounded-lg border border-stone-200 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">Order #{order.orderNumber}</span>
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800">
                        {order.status || "NEW"}
                      </span>
                    </div>
                    {order.status === "CANCELLED" ? (
                      <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        This order was cancelled. Please ask restaurant staff if
                        you need help.
                      </p>
                    ) : (
                      <>
                        <ol
                          aria-label={`Progress for order ${order.orderNumber}`}
                          className="mt-4 space-y-2"
                        >
                          {orderProgressSteps.map((step, index) => {
                            const currentStepIndex = orderProgressSteps.findIndex(
                              (progressStep) => progressStep.status === order.status
                            );
                            const isComplete =
                              currentStepIndex >= 0 && index < currentStepIndex;
                            const isCurrent =
                              currentStepIndex === index ||
                              (currentStepIndex < 0 && index === 0);

                            return (
                              <li
                                key={step.status}
                                aria-current={isCurrent ? "step" : undefined}
                                className={`flex items-center gap-2 text-sm ${
                                  isCurrent
                                    ? "font-semibold text-sky-800"
                                    : isComplete
                                      ? "text-slate-600"
                                      : "text-slate-400"
                                }`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                                    isCurrent
                                      ? "bg-sky-700 text-white"
                                      : isComplete
                                        ? "bg-sky-100 text-sky-800"
                                        : "border border-slate-300"
                                  }`}
                                >
                                  {isComplete ? "✓" : index + 1}
                                </span>
                                {step.label}
                              </li>
                            );
                          })}
                        </ol>
                        <p className="mt-3 text-xs text-stone-500">
                          Order status refreshes automatically every 10 seconds.
                        </p>
                      </>
                    )}
                    <p className="mt-2 text-sm font-semibold">
                      ₹{Number(order.totalAmount).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between border-t border-stone-200 pt-4 font-bold">
                <span>Orders total</span>
                <span>
                  ₹
                  {orders
                    .reduce((sum, order) => sum + Number(order.totalAmount), 0)
                    .toFixed(2)}
                </span>
              </div>
              <p className="mt-3 rounded-lg bg-stone-50 p-3 text-xs leading-5 text-stone-600">
                Show staff this session reference for help:{" "}
                <span className="break-all font-mono font-semibold text-stone-900">
                  {sessionId}
                </span>
              </p>
              <div className="mt-5 border-t border-stone-200 pt-4">
                <h3 className="font-bold">Payment preference (not processed)</h3>
                <p className="mt-1 text-sm leading-5 text-stone-500">
                  This choice is not sent to the restaurant or used to process
                  payment. Please settle the final bill with restaurant staff.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH")}
                    aria-pressed={paymentMethod === "CASH"}
                    className={`rounded-lg border px-4 py-3 font-semibold ${
                      paymentMethod === "CASH"
                        ? "border-sky-700 bg-sky-50 text-sky-800"
                        : "border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    Cash (pay restaurant staff)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("ONLINE")}
                    aria-pressed={paymentMethod === "ONLINE"}
                    className={`rounded-lg border px-4 py-3 font-semibold ${
                      paymentMethod === "ONLINE"
                        ? "border-sky-700 bg-sky-50 text-sky-800"
                        : "border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    Online (not available)
                  </button>
                </div>
                {paymentMethod && (
                  <p
                    role="status"
                    className="mt-3 rounded-lg bg-sky-50 p-3 text-sm leading-5 text-sky-800"
                  >
                    {paymentMethod === "CASH"
                      ? "Cash selected. Please pay restaurant staff when you are ready to leave."
                      : "Online payment is not available yet. Please choose cash and pay restaurant staff."}
                  </p>
                )}
              </div>
            </section>
          )}

          <form
            onSubmit={placeOrder}
            className={orders.length > 0 ? "mt-6 border-t border-stone-200 pt-5" : ""}
          >
              <h2 className="text-lg font-bold">
                {orders.length > 0 ? "Add more items" : "Your order"}
              </h2>
              {cart.length === 0 ? (
                <p className="mt-3 text-sm text-stone-500">
                  Choose items from the menu to get started.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {cart.map((item) => (
                    <li
                      key={item._id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-stone-700">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          ₹{Number(item.price).toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Remove one ${item.name} from cart`}
                          onClick={() => changeQuantity(item._id, -1)}
                          className="h-8 w-8 rounded-full border border-stone-300 font-semibold hover:bg-stone-50"
                        >
                          −
                        </button>
                        <span className="min-w-5 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Add one ${item.name} to cart`}
                          onClick={() => changeQuantity(item._id, 1)}
                          className="h-8 w-8 rounded-full bg-sky-700 font-semibold text-white hover:bg-sky-800"
                        >
                          +
                        </button>
                        <span className="min-w-16 text-right font-medium">
                          ₹{(Number(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {cartStorageError && (
                <p
                  role="alert"
                  className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"
                >
                  {cartStorageError}
                </p>
              )}
              <div className="mt-5 flex justify-between border-t border-stone-200 pt-4 font-bold">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>

              {error && (
                <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                className="mt-5 w-full rounded-lg bg-sky-700 px-4 py-3 font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Sending order..." : "Send order to kitchen"}
              </button>
              <p className="mt-3 text-xs leading-5 text-stone-500">
                You can place more orders at this table. Statuses remain above,
                and the final bill is handled by restaurant staff.
              </p>
          </form>
        </aside>
      </div>
    </main>
  );
}

export default CustomerMenu;
