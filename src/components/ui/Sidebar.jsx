import { useState, useEffect } from "react";
import {
  FaBars,
  FaUtensils,
  FaClipboardList,
  FaPen,
  FaTags,
  FaUsers,
  FaUserCircle,
} from "react-icons/fa";
import { MdDashboard, MdKitchen } from "react-icons/md";
import { Link } from "react-router-dom";
import { MdTableRestaurant } from "react-icons/md";
import { BsCalendar3 } from "react-icons/bs";
import { LuChefHat } from "react-icons/lu";
import { BiBell } from "react-icons/bi";

const menuItems = [
  { icon: <MdDashboard size={20} />, label: "Dashboard", link: "/" },
  { icon: <BsCalendar3 size={20} />, label: "My Shifts", link: "/my-shifts" },
  { icon: <LuChefHat size={20} />, label: "KDS", link: "/kds" },
  {
    icon: <FaClipboardList size={20} />,
    label: "Order List",
    link: "orderlist",
  },
  { icon: <FaUtensils size={20} />, label: "Menu Items", link: "menuitems" },
  {
    icon: <FaTags size={20} />,
    label: "Components",
    link: "components",
  },
  {
    icon: <FaUserCircle size={20} />,
    label: "Profile",
    link: "profile",
  },
  {
    icon: <BiBell size={20} />,
    label: "Ready Display",
    link: "ready",
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState();

  const getAuthToken = () => {
    return localStorage.getItem("auth_token") || "";
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/user/profile`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Load selected index from localStorage on component mount
  useEffect(() => {
    const storedIndex = localStorage.getItem("selectedIndex");
    if (storedIndex) {
      setSelectedIndex(Number(storedIndex));
    }
  }, []);

  const handleMenuItemClick = (index) => {
    setSelectedIndex(index);
    localStorage.setItem("selectedIndex", index);
  };

  return (
    <div
      className={`sticky top-0 h-screen bg-white shadow-md flex flex-col ${
        collapsed ? "w-[3.8rem] px-0 py-8" : "w-64 p-4"
      } transition-all duration-300`}
    >
      {/* Logo and Toggle */}
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <div>
            <div className="text-2xl font-bold">Food</div>
            <div className="text-sm text-gray-400">Experience Comfort</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-600"
        >
          <FaBars size={24} />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 mt-8 flex flex-col gap-4">
        {menuItems.map((item, index) => (
          <>
            {profile?.role !== "chef" && item.link === "/kds" ? null : (
              <Link
                to={item.link}
                key={index}
                onClick={() => handleMenuItemClick(index)}
                className={`flex items-center gap-4 p-3 rounded-md mx-2 transition-all
              ${
                selectedIndex === index
                  ? "bg-[#333] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              >
                {item.icon}
                {!collapsed && (
                  <span className="text-md font-bold">{item.label}</span>
                )}
              </Link>
            )}
          </>
        ))}
      </nav>
    </div>
  );
}
