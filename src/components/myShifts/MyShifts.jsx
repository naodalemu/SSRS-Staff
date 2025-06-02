import { useState, useEffect } from "react";
import { FaClipboardList, FaCalendarAlt } from "react-icons/fa";
import { FiRefreshCw } from "react-icons/fi";

// Helper function to calculate shift duration
const calculateShiftDuration = (startTime, endTime) => {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const diffMs = end - start;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  } else {
    return `${diffMinutes}m`;
  }
};

function MyShifts() {
  const [profile, setProfile] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
    } catch (error) {
      console.error("Error fetching shifts:", error);
    } finally {
      setShiftsLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (!profile?.id) return;

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
    }
  };

  // Fetch shifts when profile is loaded
  useEffect(() => {
    if (profile?.id) {
      fetchShifts();
      fetchAttendance();
    }
  }, [profile?.id]);

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
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto p-6">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold">My Shifts</h1>
        <p className="text-gray-500">
          View all your scheduled and completed shifts
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center">
            <FaClipboardList className="mr-2" /> All My Shifts
          </h2>
          <p className="text-gray-600 mt-1">
            Complete overview of your work schedule
          </p>
        </div>

        {shiftsLoading ? (
          <div className="p-8 text-center">
            <FiRefreshCw className="animate-spin text-3xl mb-2 mx-auto text-gray-400" />
            <p className="text-gray-500">Loading your shifts...</p>
          </div>
        ) : shifts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shifts
                  .sort(
                    (a, b) =>
                      new Date(`${a.date}T${a.start_time}`) -
                      new Date(`${b.date}T${b.start_time}`)
                  )
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )
                  .map((shift, index) => {
                    const isPast =
                      new Date(`${shift.date}T${shift.end_time}`) < new Date();
                    const isToday =
                      shift.date === new Date().toISOString().split("T")[0];
                    const duration = calculateShiftDuration(
                      shift.start_time,
                      shift.end_time
                    );
                    const attendanceStatus = getShiftAttendanceStatus(shift.id);

                    return (
                      <tr
                        key={shift.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`font-medium ${
                              isToday ? "text-blue-600" : "text-gray-900"
                            }`}
                          >
                            {formatDate(shift.date)}
                          </div>
                          {isToday && (
                            <div className="text-xs text-blue-500">Today</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {formatTime(shift.start_time)}
                          {attendanceStatus.clockIn &&
                            attendanceStatus.lateMinutes > 0 && (
                              <div className="text-xs text-orange-600 flex items-center mt-1">
                                +{attendanceStatus.lateMinutes}m late
                                {attendanceStatus.lateApproved && (
                                  <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                    ✓ Approved
                                  </span>
                                )}
                              </div>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {formatTime(shift.end_time)}
                          {attendanceStatus.clockOut &&
                            attendanceStatus.earlyMinutes > 0 && (
                              <div className="text-xs text-blue-600 flex items-center mt-1">
                                -{attendanceStatus.earlyMinutes}m early
                                {attendanceStatus.earlyApproved && (
                                  <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                    ✓ Approved
                                  </span>
                                )}
                              </div>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {duration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                                  : isToday
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
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
                                : isToday
                                ? "Today"
                                : "Upcoming"}
                            </span>
                            {attendanceStatus.status === "absent" &&
                              attendanceStatus.absenceApproved && (
                                <span className="text-xs text-green-600 font-medium">
                                  ✓ Absence Approved
                                </span>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {shifts.length > itemsPerPage && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(
                        Math.min(
                          currentPage + 1,
                          Math.ceil(shifts.length / itemsPerPage)
                        )
                      )
                    }
                    disabled={
                      currentPage === Math.ceil(shifts.length / itemsPerPage)
                    }
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, shifts.length)}
                      </span>{" "}
                      of <span className="font-medium">{shifts.length}</span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(currentPage - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from(
                        { length: Math.ceil(shifts.length / itemsPerPage) },
                        (_, i) => i + 1
                      )
                        .filter((page) => {
                          const totalPages = Math.ceil(
                            shifts.length / itemsPerPage
                          );
                          if (totalPages <= 7) return true;
                          if (page === 1 || page === totalPages) return true;
                          if (
                            page >= currentPage - 1 &&
                            page <= currentPage + 1
                          )
                            return true;
                          return false;
                        })
                        .map((page, index, array) => {
                          const showEllipsis =
                            index > 0 && array[index - 1] !== page - 1;
                          return (
                            <div key={page}>
                              {showEllipsis && (
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                  ...
                                </span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}
                              >
                                {page}
                              </button>
                            </div>
                          );
                        })}
                      <button
                        onClick={() =>
                          setCurrentPage(
                            Math.min(
                              currentPage + 1,
                              Math.ceil(shifts.length / itemsPerPage)
                            )
                          )
                        }
                        disabled={
                          currentPage ===
                          Math.ceil(shifts.length / itemsPerPage)
                        }
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <FaCalendarAlt className="text-3xl mb-2 mx-auto" />
            <p>No shifts scheduled</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default MyShifts;
