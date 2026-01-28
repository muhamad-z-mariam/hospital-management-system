import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { scheduleAPI } from "../api/api";
import { useAuth } from "../context/AuthContext";

const MySchedule = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'calendar'

  useEffect(() => {
    if (user) {
      fetchSchedules();
    }
  }, [selectedMonth, selectedYear, user]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      // Get first and last day of selected month
      const startDate = new Date(selectedYear, selectedMonth, 1)
        .toISOString()
        .split("T")[0];
      const endDate = new Date(selectedYear, selectedMonth + 1, 0)
        .toISOString()
        .split("T")[0];

      const data = await scheduleAPI.getAll({
        user: user.id,
        start_date: startDate,
        end_date: endDate,
      });

      setSchedules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[month];
  };

  const changeMonth = (delta) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const getDaysInMonth = () => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    return new Date(selectedYear, selectedMonth, 1).getDay();
  };

  const getScheduleForDate = (day) => {
    const dateStr = new Date(selectedYear, selectedMonth, day)
      .toISOString()
      .split("T")[0];
    return schedules.filter((s) => s.date === dateStr);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth();
    const firstDay = getFirstDayOfMonth();
    const days = [];
    const weeks = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={styles.calendarDayEmpty}></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const daySchedules = getScheduleForDate(day);
      const isToday =
        day === new Date().getDate() &&
        selectedMonth === new Date().getMonth() &&
        selectedYear === new Date().getFullYear();

      days.push(
        <div
          key={day}
          style={{
            ...styles.calendarDay,
            ...(isToday && styles.calendarDayToday),
          }}
        >
          <div style={styles.calendarDayNumber}>{day}</div>
          <div style={styles.calendarDaySchedules}>
            {daySchedules.map((schedule) => (
              <div
                key={schedule.id}
                style={{
                  ...styles.calendarSchedule,
                  backgroundColor: schedule.is_available
                    ? "#dcfce7"
                    : "#fee2e2",
                  color: schedule.is_available ? "#166534" : "#dc2626",
                }}
                title={`${schedule.shift} (${schedule.start_time} - ${schedule.end_time})`}
              >
                {schedule.shift}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Split into weeks
    while (days.length) {
      weeks.push(days.splice(0, 7));
    }

    return (
      <div style={styles.calendar}>
        <div style={styles.calendarHeader}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} style={styles.calendarHeaderDay}>
              {day}
            </div>
          ))}
        </div>
        {weeks.map((week, index) => (
          <div key={index} style={styles.calendarWeek}>
            {week}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.layout}>
          <Sidebar />
          <main style={styles.content}>
            <div style={styles.loading}>Loading your schedule...</div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>📅 My Schedule</h1>
            <div style={styles.viewToggle}>
              <button
                onClick={() => setViewMode("list")}
                style={{
                  ...styles.toggleButton,
                  ...(viewMode === "list" && styles.toggleButtonActive),
                }}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                style={{
                  ...styles.toggleButton,
                  ...(viewMode === "calendar" && styles.toggleButtonActive),
                }}
              >
                Calendar View
              </button>
            </div>
          </div>

          {/* Month Navigation */}
          <div style={styles.monthNav}>
            <button onClick={() => changeMonth(-1)} style={styles.navButton}>
              ← Previous
            </button>
            <h2 style={styles.monthTitle}>
              {getMonthName(selectedMonth)} {selectedYear}
            </h2>
            <button onClick={() => changeMonth(1)} style={styles.navButton}>
              Next →
            </button>
          </div>

          {/* Statistics */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📊</div>
              <div style={styles.statValue}>{schedules.length}</div>
              <div style={styles.statLabel}>Total Shifts</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>✅</div>
              <div style={styles.statValue}>
                {schedules.filter((s) => s.is_available).length}
              </div>
              <div style={styles.statLabel}>Available</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>❌</div>
              <div style={styles.statValue}>
                {schedules.filter((s) => !s.is_available).length}
              </div>
              <div style={styles.statLabel}>Unavailable</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🌙</div>
              <div style={styles.statValue}>
                {schedules.filter((s) => s.shift === "night").length}
              </div>
              <div style={styles.statLabel}>Night Shifts</div>
            </div>
          </div>

          {/* View Content */}
          {viewMode === "list" ? (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Day</th>
                    <th style={styles.th}>Shift</th>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={styles.noData}>
                        No schedules for this month
                      </td>
                    </tr>
                  ) : (
                    schedules.map((schedule) => (
                      <tr key={schedule.id} style={styles.tableRow}>
                        <td style={styles.td}>
                          {new Date(schedule.date).toLocaleDateString()}
                        </td>
                        <td style={styles.td}>
                          {new Date(schedule.date).toLocaleDateString("en-US", {
                            weekday: "long",
                          })}
                        </td>
                        <td style={styles.td}>
                          <span style={styles.shiftBadge}>{schedule.shift}</span>
                        </td>
                        <td style={styles.td}>
                          {schedule.start_time} - {schedule.end_time}
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              backgroundColor: schedule.is_available
                                ? "#dcfce7"
                                : "#fee2e2",
                              color: schedule.is_available
                                ? "#166534"
                                : "#dc2626",
                            }}
                          >
                            {schedule.is_available ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td style={styles.td}>{schedule.notes || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            renderCalendar()
          )}
        </main>
      </div>
    </>
  );
};

const styles = {
  layout: { display: "flex" },
  content: {
    marginLeft: "250px",
    padding: "2rem",
    backgroundColor: "#f8fafc",
    minHeight: "calc(100vh - 73px)",
    width: "calc(100% - 250px)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  pageTitle: { fontSize: "2rem", color: "#1e293b", margin: 0 },
  loading: {
    textAlign: "center",
    padding: "3rem",
    fontSize: "1.1rem",
    color: "#64748b",
  },
  viewToggle: { display: "flex", gap: "0.5rem" },
  toggleButton: {
    backgroundColor: "#e2e8f0",
    color: "#64748b",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  toggleButtonActive: {
    backgroundColor: "#2563eb",
    color: "white",
  },
  monthNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    marginBottom: "2rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  monthTitle: {
    fontSize: "1.5rem",
    color: "#1e293b",
    margin: 0,
  },
  navButton: {
    backgroundColor: "#64748b",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  statCard: {
    backgroundColor: "white",
    textAlign: "center",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  statIcon: { fontSize: "2.5rem", marginBottom: "0.5rem" },
  statValue: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#1e293b",
    margin: "0.5rem 0",
  },
  statLabel: { color: "#64748b", fontSize: "0.9rem" },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflowX: "auto",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { backgroundColor: "#f1f5f9" },
  th: {
    padding: "1rem",
    textAlign: "left",
    fontWeight: "600",
    color: "#475569",
    borderBottom: "2px solid #e2e8f0",
  },
  tableRow: { transition: "background-color 0.2s" },
  td: { padding: "1rem", borderBottom: "1px solid #e2e8f0", color: "#334155" },
  noData: {
    padding: "2rem",
    textAlign: "center",
    color: "#64748b",
    fontStyle: "italic",
  },
  statusBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "500",
  },
  shiftBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "500",
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    textTransform: "capitalize",
  },
  calendar: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  calendarHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  },
  calendarHeaderDay: {
    textAlign: "center",
    fontWeight: "600",
    color: "#475569",
    padding: "0.75rem",
  },
  calendarWeek: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  },
  calendarDay: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "0.5rem",
    minHeight: "100px",
    backgroundColor: "white",
  },
  calendarDayToday: {
    border: "2px solid #2563eb",
    backgroundColor: "#eff6ff",
  },
  calendarDayEmpty: {
    minHeight: "100px",
  },
  calendarDayNumber: {
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "0.5rem",
  },
  calendarDaySchedules: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  calendarSchedule: {
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "500",
    textAlign: "center",
    textTransform: "capitalize",
  },
};

export default MySchedule;
