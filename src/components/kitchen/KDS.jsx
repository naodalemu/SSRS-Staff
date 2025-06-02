import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiCoffee,
  FiCheck,
} from "react-icons/fi";
import { FaUtensils, FaHamburger, FaWineGlassAlt } from "react-icons/fa";
import MessageModal from "../ui/MessageModal";

function KDS() {
  const [orders, setOrders] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("in-progress");
  const [statusUpdating, setStatusUpdating] = useState({});
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [modalStatus, setModalStatus] = useState(null); // Modal status
  const [modalMessage, setModalMessage] = useState(""); // Modal message

  const location = useLocation();
  const intervalIdRef = useRef(null);

  // Get auth token from localStorage or wherever it's stored
  const getAuthToken = () => {
    return localStorage.getItem("auth_token") || "";
  };

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/orders/kds`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();

      // Sort orders by date (oldest first)
      const sortedOrders = data.orders.sort(
        (a, b) => new Date(a.order_date_time) - new Date(b.order_date_time)
      );

      setOrders(sortedOrders);
      setLastRefreshed(new Date());
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(`Failed to load orders: ${error.message}`);
      setLoading(false);
    }
  }, []);

  const fetchIngredients = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/ingredients`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ingredients: ${response.status}`);
      }

      const data = await response.json();
      setIngredients(data.ingredients);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    setStatusUpdating((prev) => ({ ...prev, [orderId]: true }));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order_status: newStatus }),
        }
      );

      const data = await response.json();
      console.log(data)
      
      if (!response.ok) {
        throw new Error("Failed to update order status");
      }


      // Update local state to reflect the change
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.order_id === orderId
            ? { ...order, order_status: newStatus }
            : order
        )
      );
    } catch (error) {
      console.error("Error updating order status:", error);
      setModalStatus(false); // Show error modal
      setModalMessage("Failed to update order status. Please try again.");
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // --- Effect 1: Initial Data Fetch and Cleanup for the interval ---
  useEffect(() => {
    // This effect runs once on mount to fetch initial data.
    fetchOrders();
    fetchIngredients();

    // The cleanup function for this useEffect is critical.
    // It will always run when the component unmounts.
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [fetchOrders, fetchIngredients]);

  // --- Effect 2: Manage the Polling Interval ---
  useEffect(() => {
    // Clear any existing interval before setting a new one
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    // Start a new interval ONLY if we are on the KDS path
    // You might need to adjust the path check based on your routing setup
    if (location.pathname === "/kds" || location.pathname.includes("kds")) {
      intervalIdRef.current = setInterval(() => {
        fetchOrders();
      }, 3000);
    }

    // This effect depends on location.pathname (to stop polling if we navigate away)
    // and fetchOrders (though it's memoized, it's good practice).
  }, [location.pathname, fetchOrders]);

  const getIngredientName = (id) => {
    const ingredient = ingredients.find((ing) => ing.id === id);
    return ingredient ? ingredient.name : `Ingredient #${id}`;
  };

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const getTimeSince = (dateTimeStr) => {
    const orderTime = new Date(dateTimeStr);
    const now = new Date();
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  };

  const getOrderTypeIcon = (orderType) => {
    switch (orderType) {
      case "dine-in":
        return <FaUtensils className="text-blue-500" title="Dine-in" />;
      case "takeaway":
        return <FaHamburger className="text-green-500" title="Takeaway" />;
      case "remote":
        return <FaWineGlassAlt className="text-purple-500" title="Remote" />;
      default:
        return <FaUtensils className="text-gray-500" title={orderType} />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
            <FiClock className="mr-1" size={12} />
            Pending
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
            <FiCoffee className="mr-1" size={12} />
            Processing
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            <FiCheck className="mr-1" size={12} />
            Ready
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            <FiCheckCircle className="mr-1" size={12} />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
            {status}
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "in-progress") {
      // Show pending and processing orders in the first tab
      return (
        order.order_status === "pending" || order.order_status === "processing"
      );
    } else if (activeTab === "completed") {
      // Show ready and completed orders in the second tab
      return (
        order.order_status === "ready" || order.order_status === "completed"
      );
    }
    return false; // Don't show canceled orders
  });

  // Count orders by status
  const pendingCount = orders.filter(
    (o) => o.order_status === "pending"
  ).length;
  const processingCount = orders.filter(
    (o) => o.order_status === "processing"
  ).length;
  const readyCount = orders.filter((o) => o.order_status === "ready").length;
  const completedCount = orders.filter(
    (o) => o.order_status === "completed"
  ).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <FiRefreshCw className="animate-spin text-3xl mb-2 mx-auto text-gray-600" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Kitchen Display System</h1>
          <p className="text-gray-500">
            Foods and drinks that are displayed on the customer menu are here
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <button
            onClick={() => {
              setLoading(true);
              fetchOrders();
              fetchIngredients();
            }}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 py-2 px-4 rounded-md flex items-center"
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-3 px-6 font-medium ${
            activeTab === "in-progress"
              ? "border-b-2 border-gray-800 text-gray-800"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("in-progress")}
        >
          In Progress ({pendingCount + processingCount})
        </button>
        <button
          className={`py-3 px-6 font-medium ${
            activeTab === "completed"
              ? "border-b-2 border-gray-800 text-gray-800"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Ready & Completed ({readyCount + completedCount})
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchOrders();
            }}
            className="ml-auto bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
          <FiClock className="mx-auto text-4xl text-gray-400 mb-2" />
          <p className="text-gray-500 text-lg">
            No{" "}
            {activeTab === "in-progress"
              ? "pending or processing"
              : "ready or completed"}{" "}
            orders at the moment
          </p>
          <p className="text-gray-400 text-sm mt-1">
            New orders will appear here automatically
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const isPending = order.order_status === "pending";
            const isProcessing = order.order_status === "processing";
            const isReady = order.order_status === "ready";
            const isCompleted = order.order_status === "completed";

            return (
              <div
                key={order.order_id}
                className={`bg-white rounded-lg shadow-sm overflow-hidden border-l-4 flex flex-col justify-between ${
                  isPending
                    ? "border-yellow-400"
                    : isProcessing
                    ? "border-orange-400"
                    : isReady
                    ? "border-green-400"
                    : "border-blue-400"
                }`}
              >
                {/* Order Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="font-bold text-lg text-gray-800">
                        #{order.order_id}
                      </span>
                      <span className="ml-2">
                        {getOrderTypeIcon(order.order_type)}
                      </span>
                      {order.table_number && (
                        <span className="ml-2 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                          Table {order.table_number}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {formatDateTime(order.order_date_time)}
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        {getTimeSince(order.order_date_time)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    {getStatusBadge(order.order_status)}
                  </div>
                  {/* Order Items */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-700 mb-2">Items:</h3>
                    <ul className="space-y-3">
                      {order.items.map((item, index) => (
                        <li
                          key={index}
                          className="border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                        >
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-800">
                              {item.menu_item_name}
                            </span>
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                              x{item.quantity}
                            </span>
                          </div>

                          {item.excluded_ingredients &&
                            item.excluded_ingredients.length > 0 && (
                              <div className="mt-1">
                                <span className="text-xs text-red-600 font-medium">
                                  Exclude:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.excluded_ingredients.map(
                                    (ingredientId) => (
                                      <span
                                        key={ingredientId}
                                        className="inline-flex items-center bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded"
                                      >
                                        <FiX className="mr-1" size={10} />
                                        {getIngredientName(ingredientId)}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Order Actions */}
                <div className="bg-gray-50 p-4 border-t border-gray-100">
                  <div className="space-y-2">
                    {/* Primary Action Buttons */}
                    {isPending && (
                      <button
                        onClick={() =>
                          updateOrderStatus(order.order_id, "processing")
                        }
                        disabled={statusUpdating[order.order_id]}
                        className="w-full bg-[#333] hover:bg-[#444] text-white py-2 px-4 rounded-md font-medium flex items-center justify-center disabled:opacity-50"
                      >
                        {statusUpdating[order.order_id] ? (
                          <FiRefreshCw className="animate-spin mr-2" />
                        ) : (
                          <FiCoffee className="mr-2" />
                        )}
                        Start Preparing
                      </button>
                    )}

                    {isProcessing && (
                      <>
                        <button
                          onClick={() =>
                            updateOrderStatus(order.order_id, "ready")
                          }
                          disabled={statusUpdating[order.order_id]}
                          className="w-full bg-[#333] hover:bg-[#444] text-white py-2 px-4 rounded-md font-medium flex items-center justify-center disabled:opacity-50"
                        >
                          {statusUpdating[order.order_id] ? (
                            <FiRefreshCw className="animate-spin mr-2" />
                          ) : (
                            <FiCheckCircle className="mr-2" />
                          )}
                          Mark as Ready
                        </button>
                        {/* Back to Pending */}
                        <button
                          onClick={() =>
                            updateOrderStatus(order.order_id, "pending")
                          }
                          disabled={statusUpdating[order.order_id]}
                          className="w-full bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 py-1.5 px-4 rounded-md text-sm font-medium flex items-center justify-center disabled:opacity-50"
                        >
                          ← Back to Pending
                        </button>
                      </>
                    )}

                    {isReady && (
                      <>
                        <button
                          onClick={() =>
                            updateOrderStatus(order.order_id, "completed")
                          }
                          disabled={statusUpdating[order.order_id]}
                          className="w-full bg-[#333] hover:bg-[#444] text-white py-2 px-4 rounded-md font-medium flex items-center justify-center disabled:opacity-50"
                        >
                          {statusUpdating[order.order_id] ? (
                            <FiRefreshCw className="animate-spin mr-2" />
                          ) : (
                            <FiCheckCircle className="mr-2" />
                          )}
                          Mark as Completed
                        </button>
                        {/* Back to Processing */}
                        <button
                          onClick={() =>
                            updateOrderStatus(order.order_id, "processing")
                          }
                          disabled={statusUpdating[order.order_id]}
                          className="w-full bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 py-1.5 px-4 rounded-md text-sm font-medium flex items-center justify-center disabled:opacity-50"
                        >
                          ← Back to Processing
                        </button>
                      </>
                    )}

                    {isCompleted && (
                      <div className="space-y-2">
                        <div className="text-center text-sm text-gray-500 py-2">
                          Order Completed ✓
                        </div>
                        {/* Back to Ready */}
                        <button
                          onClick={() =>
                            updateOrderStatus(order.order_id, "ready")
                          }
                          disabled={statusUpdating[order.order_id]}
                          className="w-full bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 py-1.5 px-4 rounded-md text-sm font-medium flex items-center justify-center disabled:opacity-50"
                        >
                          ← Back to Ready
                        </button>
                      </div>
                    )}

                    {/* Cancel Button - Only for pending and processing orders */}
                    {(isPending || isProcessing) && (
                      <button
                        onClick={() =>
                          updateOrderStatus(order.order_id, "canceled")
                        }
                        disabled={statusUpdating[order.order_id]}
                        className="w-full bg-white border border-red-500 text-red-500 hover:bg-red-50 py-1.5 px-4 rounded-md text-sm font-medium flex items-center justify-center disabled:opacity-50"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Modal */}
      {modalStatus !== null && (
        <MessageModal
          isItError={!modalStatus}
          message={modalMessage}
          closeMessageBackdrop={() => {
            setModalStatus(null);
            setModalMessage("");
          }}
        />
      )}
    </section>
  );
}

export default KDS;
