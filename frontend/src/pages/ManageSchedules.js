import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { scheduleAPI, doctorAPI, nurseAPI } from "../api/api";

const ManageSchedules = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [roleFilter, setRoleFilter] = useState("doctor"); // 'doctor' or 'nurse'

  // Week selection
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));

  // Weekly grid state
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [weeklyGrid, setWeeklyGrid] = useState({});
  const [notes, setNotes] = useState("");

  const shifts = ["morning", "afternoon", "night"];
  const shiftTimes = {
    morning: { start: "08:00", end: "16:00" },
    afternoon: { start: "12:00", end: "20:00" },
    night: { start: "20:00", end: "08:00" },
  };

  useEffect(() => {
    fetchData();
  }, [currentWeekStart]);

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  function getWeekDates(startDate) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const [schedulesData, doctorsData, nursesData] = await Promise.all([
        scheduleAPI.getByDateRange(
          currentWeekStart.toISOString().split("T")[0],
          weekEnd.toISOString().split("T")[0]
        ),
        doctorAPI.getAll(),
        nurseAPI.getAll(),
      ]);

      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      setNurses(Array.isArray(nursesData) ? nursesData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setSchedules([]);
      setDoctors([]);
      setNurses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setSelectedStaff(null);
    setWeeklyGrid({});
    setNotes("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStaff(null);
    setWeeklyGrid({});
  };

  const toggleShift = (dayIndex, shift) => {
    const key = `${dayIndex}-${shift}`;
    setWeeklyGrid((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const copyFromLastWeek = async () => {
    if (!selectedStaff) {
      alert("Please select a staff member first");
      return;
    }

    try {
      const lastWeekStart = new Date(currentWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);

      const lastWeekSchedules = await scheduleAPI.getAll({
        user: selectedStaff.user.id,
        start_date: lastWeekStart.toISOString().split("T")[0],
        end_date: lastWeekEnd.toISOString().split("T")[0],
      });

      const newGrid = {};
      lastWeekSchedules.forEach((schedule) => {
        const scheduleDate = new Date(schedule.date);
        const dayOfWeek = scheduleDate.getDay();
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Mon=0, Sun=6
        const key = `${dayIndex}-${schedule.shift}`;
        newGrid[key] = true;
      });

      setWeeklyGrid(newGrid);
      alert("Copied from last week!");
    } catch (error) {
      console.error("Error copying from last week:", error);
      alert("Failed to copy from last week");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStaff) {
      alert("Please select a staff member");
      return;
    }

    const selectedShifts = Object.entries(weeklyGrid).filter(
      ([key, value]) => value
    );

    if (selectedShifts.length === 0) {
      alert("Please select at least one shift");
      return;
    }

    try {
      const weekDates = getWeekDates(currentWeekStart);
      const schedulesToCreate = selectedShifts.map(([key, _]) => {
        const [dayIndex, shift] = key.split("-");
        const date = weekDates[parseInt(dayIndex)];

        return {
          user_id: selectedStaff.user.id,
          date: date.toISOString().split("T")[0],
          shift: shift,
          start_time: shiftTimes[shift].start,
          end_time: shiftTimes[shift].end,
          is_available: true,
          notes: notes,
        };
      });

      const result = await scheduleAPI.bulkCreate(schedulesToCreate);

      if (result.errors && result.errors.length > 0) {
        alert(
          `Created ${result.created.length} schedules. ${result.errors.length} failed (possibly duplicates).`
        );
      } else {
        alert(`Successfully created ${schedulesToCreate.length} schedules!`);
      }

      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error("Error creating schedules:", error);
      alert(error.error || "Failed to create schedules");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      try {
        await scheduleAPI.delete(id);
        alert("Schedule deleted successfully!");
        fetchData();
      } catch (error) {
        console.error("Error deleting schedule:", error);
        alert("Failed to delete schedule");
      }
    }
  };

  const changeWeek = (delta) => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + delta * 7);
    setCurrentWeekStart(newWeekStart);
  };

  const getScheduleForDateAndShift = (date, shift) => {
    const dateStr = date.toISOString().split("T")[0];
    return schedules.find(
      (s) => s.date === dateStr && s.shift === shift && s.user_role === roleFilter
    );
  };

  const renderWeeklyGrid = () => {
    const weekDates = getWeekDates(currentWeekStart);
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
      <div style={styles.gridContainer}>
        <table style={styles.gridTable}>
          <thead>
            <tr>
              <th style={styles.gridHeaderCell}>Shift</th>
              {weekDates.map((date, index) => (
                <th key={index} style={styles.gridHeaderCell}>
                  <div>{dayNames[index]}</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "normal" }}>
                    {date.getDate()}/{date.getMonth() + 1}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift}>
                <td style={styles.shiftLabelCell}>
                  <div style={{ fontWeight: "600", textTransform: "capitalize" }}>
                    {shift}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    {shiftTimes[shift].start} - {shiftTimes[shift].end}
                  </div>
                </td>
                {weekDates.map((date, dayIndex) => {
                  const schedule = getScheduleForDateAndShift(date, shift);
                  return (
                    <td key={dayIndex} style={styles.gridCell}>
                      {schedule ? (
                        <div style={styles.scheduleItem}>
                          <div style={styles.scheduleName}>
                            {schedule.user_full_name}
                          </div>
                          <div style={styles.scheduleRole}>
                            {schedule.user_role}
                          </div>
                          {!schedule.is_available && (
                            <div style={styles.unavailableBadge}>Unavailable</div>
                          )}
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            style={styles.deleteSmallButton}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div style={styles.emptyCell}>-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
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
            <div style={styles.loading}>Loading schedules...</div>
          </main>
        </div>
      </>
    );
  }

  const allStaff = [
    ...doctors.map((d) => ({ ...d, type: "doctor" })),
    ...nurses.map((n) => ({ ...n, type: "nurse" })),
  ];

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>📅 Manage Schedules</h1>
            <button onClick={handleOpenModal} style={styles.addButton}>
              + Add Weekly Schedule
            </button>
          </div>

          {/* Role Filter Toggle */}
          <div style={styles.roleFilterContainer}>
            <label style={styles.roleFilterLabel}>View Schedules For:</label>
            <div style={styles.roleFilterButtons}>
              <button
                onClick={() => setRoleFilter("doctor")}
                style={{
                  ...styles.roleFilterButton,
                  ...(roleFilter === "doctor" ? styles.roleFilterButtonActive : {}),
                }}
              >
                👨‍⚕️ Doctors
              </button>
              <button
                onClick={() => setRoleFilter("nurse")}
                style={{
                  ...styles.roleFilterButton,
                  ...(roleFilter === "nurse" ? styles.roleFilterButtonActive : {}),
                }}
              >
                👩‍⚕️ Nurses
              </button>
            </div>
          </div>

          {/* Week Navigation */}
          <div style={styles.weekNav}>
            <button onClick={() => changeWeek(-1)} style={styles.navButton}>
              ← Previous Week
            </button>
            <h2 style={styles.weekTitle}>
              Week of {currentWeekStart.toLocaleDateString()} -{" "}
              {new Date(
                currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000
              ).toLocaleDateString()}
            </h2>
            <button onClick={() => changeWeek(1)} style={styles.navButton}>
              Next Week →
            </button>
          </div>

          {/* Statistics */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📊</div>
              <div style={styles.statValue}>
                {schedules.filter((s) => s.user_role === roleFilter).length}
              </div>
              <div style={styles.statLabel}>
                {roleFilter === "doctor" ? "Doctor" : "Nurse"} Shifts This Week
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                {roleFilter === "doctor" ? "👨‍⚕️" : "👩‍⚕️"}
              </div>
              <div style={styles.statValue}>
                {roleFilter === "doctor" ? doctors.length : nurses.length}
              </div>
              <div style={styles.statLabel}>
                Total {roleFilter === "doctor" ? "Doctors" : "Nurses"}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>☀️</div>
              <div style={styles.statValue}>
                {
                  schedules.filter(
                    (s) => s.shift === "morning" && s.user_role === roleFilter
                  ).length
                }
              </div>
              <div style={styles.statLabel}>Morning Shifts</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🌙</div>
              <div style={styles.statValue}>
                {
                  schedules.filter(
                    (s) => s.shift === "night" && s.user_role === roleFilter
                  ).length
                }
              </div>
              <div style={styles.statLabel}>Night Shifts</div>
            </div>
          </div>

          {/* Weekly Grid */}
          {renderWeeklyGrid()}

          {/* Add Schedule Modal */}
          {showModal && (
            <div style={styles.modalOverlay} onClick={handleCloseModal}>
              <div
                style={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={styles.modalTitle}>Create Weekly Schedule</h2>
                <form onSubmit={handleSubmit}>
                  {/* Step 1: Select Staff */}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      Step 1: Select Staff Member *
                    </label>
                    <select
                      value={selectedStaff ? selectedStaff.user.id : ""}
                      onChange={(e) => {
                        const staff = allStaff.find(
                          (s) => s.user.id === parseInt(e.target.value)
                        );
                        setSelectedStaff(staff);
                      }}
                      style={styles.input}
                      required
                    >
                      <option value="">Select Staff Member</option>
                      <optgroup label="Doctors">
                        {doctors.map((doctor) => (
                          <option key={doctor.user.id} value={doctor.user.id}>
                            Dr. {doctor.user.first_name} {doctor.user.last_name}{" "}
                            - {doctor.specialty}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Nurses">
                        {nurses.map((nurse) => (
                          <option key={nurse.user.id} value={nurse.user.id}>
                            {nurse.user.first_name} {nurse.user.last_name} -{" "}
                            {nurse.department}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {selectedStaff && (
                    <>
                      <div
                        style={{
                          ...styles.formGroup,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <label style={styles.label}>
                          Step 2: Select Shifts for the Week
                        </label>
                        <button
                          type="button"
                          onClick={copyFromLastWeek}
                          style={styles.copyButton}
                        >
                          📋 Copy from Last Week
                        </button>
                      </div>

                      {/* Weekly Grid */}
                      <div style={styles.weeklyGridContainer}>
                        <table style={styles.weeklyGridTable}>
                          <thead>
                            <tr>
                              <th style={styles.weeklyGridHeader}>Shift</th>
                              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                                (day, i) => (
                                  <th key={i} style={styles.weeklyGridHeader}>
                                    {day}
                                  </th>
                                )
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {shifts.map((shift) => (
                              <tr key={shift}>
                                <td style={styles.weeklyGridShiftCell}>
                                  <div style={{ textTransform: "capitalize" }}>
                                    {shift}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.7rem",
                                      color: "#64748b",
                                    }}
                                  >
                                    {shiftTimes[shift].start}-
                                    {shiftTimes[shift].end}
                                  </div>
                                </td>
                                {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                                  <td
                                    key={dayIndex}
                                    style={styles.weeklyGridCell}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        weeklyGrid[`${dayIndex}-${shift}`] ||
                                        false
                                      }
                                      onChange={() =>
                                        toggleShift(dayIndex, shift)
                                      }
                                      style={styles.weeklyGridCheckbox}
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.label}>Notes (Optional)</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          style={{ ...styles.input, minHeight: "60px" }}
                          placeholder="Any special notes for these shifts..."
                        />
                      </div>
                    </>
                  )}

                  <div style={styles.modalActions}>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={styles.submitButton}
                      disabled={!selectedStaff}
                    >
                      Create Schedules
                    </button>
                  </div>
                </form>
              </div>
            </div>
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
  addButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
  },
  loading: {
    textAlign: "center",
    padding: "3rem",
    fontSize: "1.1rem",
    color: "#64748b",
  },
  weekNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    marginBottom: "2rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  weekTitle: {
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
  gridContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflowX: "auto",
  },
  gridTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  gridHeaderCell: {
    padding: "1rem",
    textAlign: "center",
    fontWeight: "600",
    color: "#475569",
    backgroundColor: "#f1f5f9",
    borderBottom: "2px solid #e2e8f0",
    minWidth: "120px",
  },
  shiftLabelCell: {
    padding: "1rem",
    fontWeight: "600",
    color: "#1e293b",
    backgroundColor: "#f8fafc",
    borderRight: "2px solid #e2e8f0",
    minWidth: "150px",
  },
  gridCell: {
    padding: "0.5rem",
    borderBottom: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    textAlign: "center",
    verticalAlign: "middle",
    minHeight: "80px",
  },
  scheduleItem: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    padding: "0.5rem",
    position: "relative",
  },
  scheduleName: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: "0.25rem",
  },
  scheduleRole: {
    fontSize: "0.7rem",
    color: "#64748b",
    textTransform: "capitalize",
  },
  unavailableBadge: {
    fontSize: "0.65rem",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "0.125rem 0.25rem",
    borderRadius: "4px",
    marginTop: "0.25rem",
  },
  deleteSmallButton: {
    position: "absolute",
    top: "2px",
    right: "2px",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    fontSize: "0.9rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  emptyCell: {
    color: "#cbd5e1",
    fontSize: "1.5rem",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "2rem",
    width: "90%",
    maxWidth: "800px",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalTitle: {
    fontSize: "1.5rem",
    color: "#1e293b",
    marginTop: 0,
    marginBottom: "1.5rem",
  },
  formGroup: { marginBottom: "1.5rem" },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    color: "#475569",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "1rem",
    color: "#1e293b",
    boxSizing: "border-box",
  },
  copyButton: {
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  weeklyGridContainer: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    overflow: "hidden",
    marginBottom: "1rem",
  },
  weeklyGridTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  weeklyGridHeader: {
    padding: "0.75rem",
    backgroundColor: "#f1f5f9",
    fontWeight: "600",
    color: "#475569",
    fontSize: "0.9rem",
    textAlign: "center",
    borderBottom: "1px solid #e2e8f0",
  },
  weeklyGridShiftCell: {
    padding: "0.75rem",
    backgroundColor: "#f8fafc",
    fontWeight: "600",
    color: "#1e293b",
    fontSize: "0.85rem",
    borderRight: "1px solid #e2e8f0",
    borderBottom: "1px solid #e2e8f0",
  },
  weeklyGridCell: {
    padding: "0.75rem",
    textAlign: "center",
    borderRight: "1px solid #e2e8f0",
    borderBottom: "1px solid #e2e8f0",
  },
  weeklyGridCheckbox: {
    width: "20px",
    height: "20px",
    cursor: "pointer",
  },
  modalActions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
    marginTop: "2rem",
  },
  cancelButton: {
    backgroundColor: "#64748b",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
  },
  roleFilterContainer: {
    backgroundColor: "white",
    padding: "1rem 1.5rem",
    borderRadius: "12px",
    marginBottom: "2rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  roleFilterLabel: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#475569",
  },
  roleFilterButtons: {
    display: "flex",
    gap: "0.5rem",
  },
  roleFilterButton: {
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    border: "2px solid #e2e8f0",
    padding: "0.5rem 1.25rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  roleFilterButtonActive: {
    backgroundColor: "#2563eb",
    color: "white",
    borderColor: "#2563eb",
  },
};

export default ManageSchedules;
