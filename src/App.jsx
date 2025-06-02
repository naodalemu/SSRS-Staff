import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Dashboard from "./components/dashboard/Dashboard";
import Sidebar from "./components/ui/Sidebar";
import TopNavbar from "./components/ui/TopNavbar";
import OrderList from "./components/orderlist/OrderList";
import Login from "./components/auth/Login";
import PrivateRoute from "./components/auth/PrivateRoute";
import ForgotPassword from "./components/auth/ForgotPassword";
import AddOrders from "./components/orderlist/AddOrders";
import MenuItems from "./components/menuitems/Menuitems";
import AddMenuItems from "./components/menuitems/AddMenuItems";
import AddIngredientsTagsCategories from "./components/IngredientsTagsCategories/AddIngredientsTagsCategories";
import PasswordReset from "./components/auth/PasswordReset";
import UpdateMenuItem from "./components/menuitems/UpdateMenuItem";
import UpdateOrder from "./components/orderlist/UpdateOrder";
import Profile from "./components/profile/Profile";
import MyShifts from "./components/myShifts/MyShifts";
import KDS from "./components/kitchen/KDS";
import Ready from "./components/kitchen/Ready";

function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNavbar />
        <main className="flex-1 sm:p-6">
          <Routes>
            {/* Protected Pages */}
            {/* Dashboard */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            {/* Order List */}
            <Route
              path="/orderlist"
              element={
                <PrivateRoute>
                  <OrderList />
                </PrivateRoute>
              }
            />
            <Route
              path="/orderlist/add-order"
              element={
                <PrivateRoute>
                  <AddOrders />
                </PrivateRoute>
              }
            />
            <Route
              path="/orders/:orderid"
              element={
                <PrivateRoute>
                  <UpdateOrder />
                </PrivateRoute>
              }
            />
            {/* Menu Items */}
            <Route
              path="/menuitems"
              element={
                <PrivateRoute>
                  <MenuItems />
                </PrivateRoute>
              }
            />
            <Route
              path="/menuitems/add-menuitem"
              element={
                <PrivateRoute>
                  <AddMenuItems />
                </PrivateRoute>
              }
            />
            <Route
              path="/menuitems/:menuitemsid"
              element={
                <PrivateRoute>
                  <UpdateMenuItem />
                </PrivateRoute>
              }
            />
            {/* Components for Menu Item */}
            <Route
              path="/components"
              element={
                <PrivateRoute>
                  <AddIngredientsTagsCategories />
                </PrivateRoute>
              }
            />
            {/* Profile */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            {/* Shifts */}
            <Route
              path="/my-shifts"
              element={
                <PrivateRoute>
                  <MyShifts />
                </PrivateRoute>
              }
            />
            {/* Kitchen */}
            <Route
              path="/kds"
              element={
                <PrivateRoute>
                  <KDS />
                </PrivateRoute>
              }
            />
            <Route
              path="/ready"
              element={
                <PrivateRoute>
                  <Ready />
                </PrivateRoute>
              }
            />
            {/* You can add more protected routes easily here later */}
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();
  const isAuthPage = ["/login", "/forgot-password", "/reset-password"].includes(
    location.pathname
  );

  return (
    <div className="App">
      {isAuthPage ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<PasswordReset />} />
        </Routes>
      ) : (
        <Layout />
      )}
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
