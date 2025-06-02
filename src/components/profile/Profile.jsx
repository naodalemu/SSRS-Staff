import { useState, useEffect } from "react";
import {
  FiUser,
  FiEdit2,
  FiSave,
  FiX,
  FiDollarSign,
  FiCalendar,
  FiMail,
  FiTag,
  FiTrendingUp,
  FiRefreshCw,
  FiLock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import MessageModal from "../ui/MessageModal";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });
  const [modalStatus, setModalStatus] = useState(null);
  const [modalMessage, setModalMessage] = useState("");

  // Get auth token from localStorage or wherever it's stored
  const getAuthToken = () => {
    return localStorage.getItem("auth_token") || "";
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setProfileLoading(true);
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
      setNewName(data.name);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!newName.trim()) {
      setModalStatus(false);
      setModalMessage("Name cannot be empty");
      return;
    }

    setUpdateLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/staff/update`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newName.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      await response.json();
      fetchProfile();
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setModalStatus(false);
      setModalMessage("Failed to update profile. Please try again.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const cancelEdit = () => {
    setNewName(profile.name);
    setIsEditingName(false);
  };

  const changePassword = async () => {
    if (!passwordData.current_password.trim()) {
      setPasswordMessage({
        type: "error",
        text: "Current password is required",
      });
      return;
    }

    if (passwordData.new_password.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 6 characters",
      });
      return;
    }

    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage({ type: "", text: "" });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/staff/change-password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_password: passwordData.current_password,
            new_password: passwordData.new_password,
            new_password_confirmation: passwordData.new_password_confirmation,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change password");
      }

      setPasswordMessage({
        type: "success",
        text: "Password changed successfully!",
      });
      setPasswordData({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
      setIsChangingPassword(false);
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordMessage({
        type: "error",
        text: error.message || "Failed to change password. Please try again.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const cancelPasswordChange = () => {
    setPasswordData({
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    });
    setIsChangingPassword(false);
    setPasswordMessage({ type: "", text: "" });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <FiRefreshCw className="animate-spin text-3xl mb-2 mx-auto text-blue-500" />
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-red-500">
          <p>Failed to load profile. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-gray-500">Manage your profile information</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-6 flex items-center">
          <FaUserCircle className="mr-2" /> Profile Information
        </h2>

        <div className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiUser className="inline mr-1" /> Full Name
            </label>
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your name"
                />
                <button
                  onClick={updateProfile}
                  disabled={updateLoading}
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md"
                >
                  {updateLoading ? (
                    <FiRefreshCw className="animate-spin" />
                  ) : (
                    <FiSave />
                  )}
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-md"
                >
                  <FiX />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="font-medium">{profile.name}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FiEdit2 />
                </button>
              </div>
            )}
          </div>

          {/* Read-only fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiTag className="inline mr-1" /> Staff ID
            </label>
            <div className="p-3 bg-gray-50 rounded-md">
              <span className="font-mono text-sm">{profile.staff_id}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiMail className="inline mr-1" /> Email Address
            </label>
            <div className="p-3 bg-gray-50 rounded-md">
              <span>{profile.email}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiUser className="inline mr-1" /> Role
            </label>
            <div className="p-3 bg-gray-50 rounded-md">
              <span className="capitalize">{profile.role}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiDollarSign className="inline mr-1" /> Total Salary
              </label>
              <div className="p-3 bg-green-50 rounded-md">
                <span className="font-medium text-green-800">
                  {formatCurrency(profile.total_salary)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiTrendingUp className="inline mr-1" /> Tips Earned
              </label>
              <div className="p-3 bg-blue-50 rounded-md">
                <span className="font-medium text-blue-800">
                  {formatCurrency(profile.tips)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiCalendar className="inline mr-1" /> Member Since
            </label>
            <div className="p-3 bg-gray-50 rounded-md">
              <span>
                {new Date(profile.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FiLock className="mr-2" /> Security
              </h3>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Change Password
                </button>
              )}
            </div>

            {isChangingPassword && (
              <div className="space-y-4">
                {passwordMessage.text && (
                  <div
                    className={`p-3 rounded-md text-sm ${
                      passwordMessage.type === "success"
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {passwordMessage.text}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.current_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          current_password: e.target.value,
                        })
                      }
                      className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({
                          ...showPasswords,
                          current: !showPasswords.current,
                        })
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          new_password: e.target.value,
                        })
                      }
                      className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({
                          ...showPasswords,
                          new: !showPasswords.new,
                        })
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.new_password_confirmation}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          new_password_confirmation: e.target.value,
                        })
                      }
                      className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({
                          ...showPasswords,
                          confirm: !showPasswords.confirm,
                        })
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={changePassword}
                    disabled={passwordLoading}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {passwordLoading ? (
                      <>
                        <FiRefreshCw className="animate-spin mr-2" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2" />
                        Change Password
                      </>
                    )}
                  </button>
                  <button
                    onClick={cancelPasswordChange}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!isChangingPassword && (
              <p className="text-sm text-gray-500">
                Keep your account secure by using a strong password and changing
                it regularly.
              </p>
            )}
          </div>
        </div>
      </div>

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

export default Profile;
