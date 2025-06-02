import { useState, useEffect, useRef, useCallback } from "react"
import { useLocation } from "react-router-dom"
import { FiClock, FiRefreshCw } from "react-icons/fi"
import { FaUtensils } from "react-icons/fa"

function Ready() {
  const [allReadyOrders, setAllReadyOrders] = useState([])
  const [displayingOrders, setDisplayingOrders] = useState([])
  const [queuedOrders, setQueuedOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [alreadyDisplayedOrders, setAlreadyDisplayedOrders] = useState(new Set())

  const location = useLocation()
  const fetchIntervalRef = useRef(null)
  const displayTimersRef = useRef({})

  const DISPLAY_DURATION = 2 * 60 * 1000 // 2 minutes in milliseconds

  // Get auth token from localStorage or wherever it's stored
  const getAuthToken = () => {
    return localStorage.getItem("auth_token") || ""
  }

  const fetchReadyOrders = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/orders/ready`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch ready orders: ${response.status}`)
      }

      const data = await response.json()
      setAllReadyOrders(data.ready_orders || [])
      setError(null)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching ready orders:", error)
      setError(`Failed to load ready orders: ${error.message}`)
      setLoading(false)
    }
  }, [])

  const removeOrderFromDisplay = useCallback((orderId) => {
    setDisplayingOrders((prev) => {
      const updated = prev.filter((order) => order.order_id !== orderId)
      return updated
    })

    // Add to already displayed orders
    setAlreadyDisplayedOrders((prev) => new Set([...prev, orderId]))

    // Clear the timer for this order
    if (displayTimersRef.current[orderId]) {
      clearTimeout(displayTimersRef.current[orderId])
      delete displayTimersRef.current[orderId]
    }
  }, [])

  // Function to start displaying an order with a timer
  const startDisplayingOrder = useCallback(
    (order) => {
      setDisplayingOrders((prev) => {
        // Don't add if already displaying
        if (prev.find((o) => o.order_id === order.order_id)) {
          return prev
        }
        return [...prev, { ...order, startTime: Date.now() }]
      })

      // Set timer to remove this order after 2 minutes
      displayTimersRef.current[order.order_id] = setTimeout(() => {
        removeOrderFromDisplay(order.order_id)
      }, DISPLAY_DURATION)
    },
    [removeOrderFromDisplay],
  )

  useEffect(() => {
    const currentDisplayingIds = displayingOrders.map((o) => o.order_id)
    const newOrders = allReadyOrders.filter(
      (order) => !currentDisplayingIds.includes(order.order_id) && !alreadyDisplayedOrders.has(order.order_id),
    )

    // Update queued orders (orders that aren't currently displaying and haven't been displayed)
    setQueuedOrders(newOrders)

    // Start displaying new orders if we have space
    newOrders.forEach((order) => {
      if (displayingOrders.length === 0) {
        // No orders displaying, start this one immediately
        startDisplayingOrder(order)
      } else if (displayingOrders.length === 1) {
        // One order displaying, add this one to share the view
        startDisplayingOrder(order)
      }
      // If 2 orders are already displaying, this order will wait in queue
    })
  }, [allReadyOrders, displayingOrders.length, startDisplayingOrder, alreadyDisplayedOrders])

  useEffect(() => {
    if (displayingOrders.length < 2 && queuedOrders.length > 0) {
      const nextOrder = queuedOrders[0]
      if (nextOrder && !displayingOrders.find((o) => o.order_id === nextOrder.order_id)) {
        startDisplayingOrder(nextOrder)
      }
    }
  }, [displayingOrders.length, queuedOrders, startDisplayingOrder, displayingOrders])

  // Effect for fetching data and cleanup
  useEffect(() => {
    fetchReadyOrders()

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current)
      }
      // Clear all display timers
      Object.values(displayTimersRef.current).forEach(clearTimeout)
      displayTimersRef.current = {}
    }
  }, [fetchReadyOrders])

  // Effect for auto-refresh interval
  useEffect(() => {
    if (fetchIntervalRef.current) {
      clearInterval(fetchIntervalRef.current)
    }

    if (location.pathname === "/ready" || location.pathname.includes("ready")) {
      fetchIntervalRef.current = setInterval(() => {
        fetchReadyOrders()
      }, 5000) // Fetch every 5 seconds
    }
  }, [location.pathname, fetchReadyOrders])

  const getTimeRemaining = (order) => {
    if (!order.startTime) return DISPLAY_DURATION
    const elapsed = Date.now() - order.startTime
    const remaining = Math.max(0, DISPLAY_DURATION - elapsed)
    return remaining
  }

  const formatTimeRemaining = (milliseconds) => {
    const seconds = Math.ceil(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="animate-spin text-6xl mb-4 mx-auto text-blue-500" />
          <p className="text-2xl text-gray-600">Loading ready orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 text-red-500">⚠️</div>
          <p className="text-2xl text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              fetchReadyOrders()
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg text-lg font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b-4 border-green-500 p-6">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-2">Order Ready</h1>
          <p className="text-xl md:text-2xl text-gray-600">Please collect your order</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 md:p-12">
        {displayingOrders.length === 0 ? (
          // No orders ready
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <FaUtensils className="text-8xl md:text-9xl text-gray-300 mb-6 mx-auto" />
              <h2 className="text-3xl md:text-5xl font-bold text-gray-400 mb-4">No Orders Ready</h2>
              <p className="text-xl md:text-2xl text-gray-400">Ready orders will appear here</p>
            </div>
          </div>
        ) : (
          // Display ready orders
          <div
            className={`grid gap-8 h-full ${
              displayingOrders.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            {displayingOrders.map((order) => {
              const timeRemaining = getTimeRemaining(order)
              const progressPercentage = ((DISPLAY_DURATION - timeRemaining) / DISPLAY_DURATION) * 100

              return (
                <div
                  key={order.order_id}
                  className="bg-white rounded-2xl shadow-2xl border-4 border-green-400 overflow-hidden transform hover:scale-105 transition-transform duration-300"
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 md:p-12">
                    <div className="text-center">
                      <h2 className="text-2xl md:text-3xl font-bold mb-2">Order Ready!</h2>
                      <div className="text-6xl md:text-8xl font-black mb-4">#{order.order_id}</div>
                      <div className="text-2xl md:text-3xl font-semibold">Table {order.table_number}</div>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-8 md:p-12">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center bg-green-100 text-green-800 px-6 py-3 rounded-full text-xl md:text-2xl font-semibold">
                        <FiClock className="mr-3" />
                        Ready for Pickup
                      </div>
                    </div>

                    {/* Timer Display */}
                    <div className="text-center mb-6">
                      <p className="text-lg md:text-xl text-gray-600 mb-2">Time remaining on display:</p>
                      <div className="text-3xl md:text-4xl font-bold text-gray-800">
                        {formatTimeRemaining(timeRemaining)}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-4 md:h-6 mb-6">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>

                    {/* Call to Action */}
                    <div className="text-center">
                      <p className="text-xl md:text-2xl text-gray-700 font-medium">
                        Please proceed to the counter to collect your order
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Queue Information */}
        {queuedOrders.length > 0 && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-lg font-medium">
              <FiClock className="mr-2" />
              {queuedOrders.length} order{queuedOrders.length > 1 ? "s" : ""} waiting to display
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-90 backdrop-blur-sm p-4 text-center">
        <p className="text-gray-600">Orders display for 2 minutes • Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  )
}

export default Ready
