import { useState, useEffect } from "react";
import {
  FiRefreshCw,
  FiDollarSign,
  FiTrendingUp,
  FiClock,
  FiX,
} from "react-icons/fi";
import { FaCalendarAlt, FaClipboardList, FaHistory } from "react-icons/fa";

function Dashboard() {
  // State for user profile
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // State for shifts
  const [shifts, setShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [nearestShift, setNearestShift] = useState(null);

  // State for attendance
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  // State for UI
  const [refreshing, setRefreshing] = useState(false);

  // Get auth token from localStorage or wherever it's stored
  const getAuthToken = () => {
    return localStorage.getItem("auth_token") || "";
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const triggerAbsent = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/mark-absent`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

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
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchShifts = async () => {
    if (!profile?.id) return;

    setShiftsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/staff-shifts/${profile.id}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch shifts");
      }

      const data = await response.json();
      setShifts(data);
      findNearestShift(data);
    } catch (error) {
      console.error("Error fetching shifts:", error);
    } finally {
      setShiftsLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (!profile?.id) return;

    setAttendanceLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/attendance/${profile.id}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch attendance");
      }

      const data = await response.json();
      setAttendance(data.attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Fetch shifts when profile is loaded
  useEffect(() => {
    if (profile?.id) {
      fetchShifts();
      fetchAttendance();
    }
  }, [profile?.id]);

  const findNearestShift = (shiftsData) => {
    const now = new Date();
    const upcomingShifts = shiftsData
      .filter((shift) => {
        const shiftDateTime = new Date(`${shift.date}T${shift.start_time}`);
        return shiftDateTime > now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.start_time}`);
        const dateB = new Date(`${b.date}T${b.start_time}`);
        return dateA - dateB;
      });

    setNearestShift(upcomingShifts.length > 0 ? upcomingShifts[0] : null);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchShifts(), fetchAttendance()]);
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      currencyDisplay: "code",
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace(/^([A-Z]{3})\s*(.+)$/, "$2 $1");
  };

  const getTimeUntilShift = (shift) => {
    if (!shift) return null;

    const now = new Date();
    const shiftDateTime = new Date(`${shift.date}T${shift.start_time}`);
    const diffMs = shiftDateTime - now;

    if (diffMs <= 0) return "Starting soon";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
    }
  };

  const getShiftStats = () => {
    const now = new Date();
    const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeekShifts = shifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= thisWeekStart;
    });

    const thisMonthShifts = shifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= thisMonthStart;
    });

    // Get completed shifts based on attendance data
    const completedShifts = shifts.filter((shift) => {
      const shiftAttendance = attendance.filter(
        (att) => att.staff_shift_id === shift.id
      );
      return shiftAttendance.length > 0;
    });

    // Get present vs absent stats - simplified logic
    const presentShifts = shifts.filter((shift) => {
      const shiftAttendance = attendance.filter(
        (att) => att.staff_shift_id === shift.id && att.status === "present"
      );
      return shiftAttendance.length > 0;
    });

    const absentShifts = shifts.filter((shift) => {
      const shiftAttendance = attendance.filter(
        (att) => att.staff_shift_id === shift.id && att.status === "absent"
      );
      return shiftAttendance.length > 0;
    });

    return {
      thisWeek: thisWeekShifts.length,
      thisMonth: thisMonthShifts.length,
      completed: completedShifts.length,
      present: presentShifts.length,
      absent: absentShifts.length,
      total: shifts.length,
    };
  };

  const getShiftAttendanceStatus = (shiftId) => {
    const shiftAttendance = attendance.filter(
      (att) => att.staff_shift_id === shiftId
    );

    if (shiftAttendance.length === 0) {
      return {
        status: "no_attendance",
        clockIn: null,
        clockOut: null,
        lateMinutes: 0,
        earlyMinutes: 0,
        lateApproved: false,
        earlyApproved: false,
        absenceApproved: false,
      };
    }

    // Check if any attendance record shows "present"
    const hasPresent = shiftAttendance.some((att) => att.status === "present");
    // Check if any attendance record shows "absent"
    const hasAbsent = shiftAttendance.some((att) => att.status === "absent");

    const clockIn = shiftAttendance.find((att) => att.mode === "clock_in");
    const clockOut = shiftAttendance.find((att) => att.mode === "clock_out");

    // Check approval statuses
    const lateApproved = shiftAttendance.some((att) => att.late_approved === 1);
    const earlyApproved = shiftAttendance.some(
      (att) => att.early_approved === 1
    );
    const absenceApproved = shiftAttendance.some(
      (att) => att.approved_by_admin === 1
    );

    // Determine status based on attendance status field
    let status = "unknown";
    if (hasPresent && !hasAbsent) {
      status = "present";
    } else if (hasAbsent && !hasPresent) {
      status = "absent";
    } else if (hasPresent && hasAbsent) {
      status = "partial";
    }

    return {
      status,
      clockIn,
      clockOut,
      lateMinutes: clockIn?.late_minutes || 0,
      earlyMinutes: clockOut?.early_minutes || 0,
      lateApproved,
      earlyApproved,
      absenceApproved,
    };
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <FiRefreshCw className="animate-spin text-3xl mb-2 mx-auto text-blue-500" />
          <p className="text-gray-500">Loading your dashboard...</p>
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

  const shiftStats = getShiftStats();

  return (
    <section className="mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {profile.name}!</p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 px-4 rounded-md flex items-center"
        >
          <FiRefreshCw className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FiDollarSign className="text-blue-600 text-2xl mr-3" />
            <div>
              <div className="text-sm text-blue-600 mb-1">Total Salary</div>
              <div className="text-xl font-bold">
                {formatCurrency(profile.total_salary)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FiTrendingUp className="text-green-600 text-2xl mr-3" />
            <div>
              <div className="text-sm text-green-600 mb-1">Tips Earned</div>
              <div className="text-xl font-bold">
                {formatCurrency(profile.tips)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FaCalendarAlt className="text-purple-600 text-2xl mr-3" />
            <div>
              <div className="text-sm text-purple-600 mb-1">This Month</div>
              <div className="text-xl font-bold">
                {shiftStats.thisMonth} shifts
              </div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FaClipboardList className="text-orange-600 text-2xl mr-3" />
            <div>
              <div className="text-sm text-orange-600 mb-1">Present</div>
              <div className="text-xl font-bold">
                {shiftStats.present} shifts
              </div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FiX className="text-red-600 text-2xl mr-3" />
            <div>
              <div className="text-sm text-red-600 mb-1">Absent</div>
              <div className="text-xl font-bold">
                {shiftStats.absent} shifts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Shift Card */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FiClock className="mr-2" /> Next Shift
        </h2>

        {shiftsLoading ? (
          <div className="text-center py-4">
            <FiRefreshCw className="animate-spin text-2xl mb-2 mx-auto text-gray-400" />
            <p className="text-gray-500">Loading shifts...</p>
          </div>
        ) : nearestShift ? (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg font-medium text-blue-900">
                  {formatDate(nearestShift.date)}
                </div>
                <div className="text-blue-700 mt-1">
                  {formatTime(nearestShift.start_time)} -{" "}
                  {formatTime(nearestShift.end_time)}
                </div>
                <div className="text-sm text-blue-600 mt-2">
                  Starts in {getTimeUntilShift(nearestShift)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-600">Shift ID</div>
                <div className="font-medium text-blue-900">
                  {nearestShift.shift_id}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <FaCalendarAlt className="text-3xl mb-2 mx-auto" />
            <p>No upcoming shifts scheduled</p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FaHistory className="mr-2" /> Recent Shifts
        </h2>

        {shifts.length > 0 ? (
          <div className="space-y-3">
            {shifts
              .sort(
                (a, b) =>
                  new Date(`${a.date}T${a.start_time}`) -
                  new Date(`${b.date}T${b.start_time}`)
              )
              .slice(0, 5)
              .map((shift) => {
                const isPast =
                  new Date(`${shift.date}T${shift.end_time}`) < new Date();
                const attendanceStatus = getShiftAttendanceStatus(shift.id);

                return (
                  <div
                    key={shift.id}
                    className={`p-3 rounded-lg border ${
                      isPast
                        ? attendanceStatus.status === "present"
                          ? "bg-green-50 border-green-200"
                          : attendanceStatus.status === "absent"
                          ? "bg-red-50 border-red-200"
                          : attendanceStatus.status === "partial"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-gray-50 border-gray-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          {formatDate(shift.date)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatTime(shift.start_time)} -{" "}
                          {formatTime(shift.end_time)}
                        </div>
                        {attendanceStatus.lateMinutes > 0 && (
                          <div className="text-xs text-orange-600 mt-1 flex items-center">
                            Late by {attendanceStatus.lateMinutes} minutes
                            {attendanceStatus.lateApproved && (
                              <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                Approved
                              </span>
                            )}
                          </div>
                        )}
                        {attendanceStatus.earlyMinutes > 0 && (
                          <div className="text-xs text-blue-600 mt-1 flex items-center">
                            Left {attendanceStatus.earlyMinutes} minutes early
                            {attendanceStatus.earlyApproved && (
                              <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                Approved
                              </span>
                            )}
                          </div>
                        )}
                        {attendanceStatus.status === "absent" &&
                          attendanceStatus.absenceApproved && (
                            <div className="text-xs text-green-600 mt-1">
                              <span className="px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                Absence Approved
                              </span>
                            </div>
                          )}
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-xs px-2 py-1 rounded ${
                            isPast
                              ? attendanceStatus.status === "present"
                                ? "bg-green-100 text-green-800"
                                : attendanceStatus.status === "absent"
                                ? attendanceStatus.absenceApproved
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                                : attendanceStatus.status === "partial"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isPast
                            ? attendanceStatus.status === "present"
                              ? "Present"
                              : attendanceStatus.status === "absent"
                              ? attendanceStatus.absenceApproved
                                ? "Approved Absence"
                                : "Absent"
                              : attendanceStatus.status === "partial"
                              ? "Partial"
                              : "No Record"
                            : "Upcoming"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No shifts found</p>
        )}
      </div>
    </section>
  );
}

export default Dashboard;
