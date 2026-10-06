// components/FeedTankManagement.jsx

import React, { useState, useMemo, useEffect } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

import {
  MapPin,
  ChevronRight,
  Wrench,
  Droplet,
  Filter,
  ChevronLeft,
} from "lucide-react";

import { useData } from "../contexts/DataContext";

import { format, subDays } from "date-fns";

import { rawToPercent } from "./dashboardComponents/feedTankCalibration";

/* ============================================================
   STATUS BADGE
   ============================================================ */

const StatusBadge = ({ status }) => {
  const cfg =
    {
      Active: {
        bg: "rgba(34,197,94,0.1)",
        color: "#22c55e",
        dot: "#22c55e",
      },

      Maintenance: {
        bg: "rgba(234,179,8,0.1)",
        color: "#eab308",
        dot: "#eab308",
      },

      Standby: {
        bg: "rgba(14,165,233,0.1)",
        color: "#0ea5e9",
        dot: "#0ea5e9",
      },

      Offline: {
        bg: "rgba(239,68,68,0.1)",
        color: "#ef4444",
        dot: "#ef4444",
      },

      Warning: {
        bg: "rgba(245,158,11,0.1)",
        color: "#f59e0b",
        dot: "#f59e0b",
      },

      Empty: {
        bg: "rgba(239,68,68,0.15)",
        color: "#ef4444",
        dot: "#ef4444",
      },

      Refilling: {
        bg: "rgba(14,165,233,0.1)",
        color: "#0ea5e9",
        dot: "#0ea5e9",
      },
    }[status] || {
      bg: "rgba(77,122,158,0.1)",
      color: "#4d7a9e",
      dot: "#4d7a9e",
    };

  return (
    <span
      className="flex items-center gap-1 rounded px-1.5 py-0.5"
      style={{ background: cfg.bg }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: cfg.dot,
          display: "inline-block",
        }}
      />

      <span
        style={{
          fontSize: 10,
          color: cfg.color,
          fontWeight: 500,
        }}
      >
        {status}
      </span>
    </span>
  );
};

/* ============================================================
   HEALTH BAR
   ============================================================ */

const HealthBar = ({ value }) => {
  const safeValue = Number.isFinite(value) ? value : 0;

  const color =
    safeValue >= 80
      ? "#22c55e"
      : safeValue >= 60
        ? "#eab308"
        : "#ef4444";

  return (
    <div className="flex items-center gap-2">
      <div
        style={{
          width: 60,
          height: 4,
          background: "var(--secondary)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(Math.max(safeValue, 0), 100)}%`,
            height: "100%",
            background: color,
            borderRadius: 2,
          }}
        />
      </div>

      <span
        style={{
          fontSize: 10,
          fontFamily: "var(--font-mono)",
          color,
          minWidth: 28,
        }}
      >
        {Math.round(safeValue)}%
      </span>
    </div>
  );
};

/* ============================================================
   CHART TOOLTIP
   ============================================================ */

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "#0a1828",
        border: "1px solid rgba(14,165,233,0.2)",
        borderRadius: 4,
        padding: "6px 10px",
      }}
    >
      <p
        style={{
          fontSize: 10,
          color: "#4d7a9e",
        }}
      >
        {label}
      </p>

      {payload.map((p, i) => (
        <p
          key={i}
          style={{
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: p.color,
          }}
        >
          {p.value?.toLocaleString()} m³
        </p>
      ))}
    </div>
  );
};

/* ============================================================
   FEED TANK MANAGEMENT
   ============================================================ */

export function FeedTankManagement() {
  const { sensorData, getValue, getHistory, lastUpdate } = useData();

  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [isMobile, setIsMobile] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  /* ============================================================
     MOBILE DETECTION
     ============================================================ */

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  /* ============================================================
     OTHER LIVE VALUES
     ============================================================ */

  const feedFlow = Number(getValue("RO5-FEEDFlow")) || 0;

  const recovery = Number(getValue("RO5-SystemRecovery")) || 0;

  const stage1Delta = Number(getValue("RO5-Stage1Delta")) || 0;

  /* ============================================================
     LIVE FEED TANK LEVEL
     ============================================================

     IMPORTANT:

     The RAW transmitter is the single source of truth.

     Calibration:

       RAW 4.9  = 0%
       RAW 10.0 = 100%

     Formula is handled by:

       rawToPercent()

     We deliberately DO NOT use:

       - RO5-SystemActive
       - getDisplayedTankLevelPct()
       - DATA_FRESHNESS_WINDOW_MS
       - RO5-FeedTankLevel as the primary value

     This ensures Tank Management uses exactly the same
     calculation as the Dashboard.
     ============================================================ */

  const rawTankValue = getValue("RO5-FeedTankLevelRaw");

  const rawTankNum =
    typeof rawTankValue === "number"
      ? rawTankValue
      : parseFloat(rawTankValue);

  const hasRawTankReading = Number.isFinite(rawTankNum);

  const calibratedPct = hasRawTankReading
    ? rawToPercent(rawTankNum)
    : null;

  /*
   * This is the actual value used everywhere in this page.
   */
  const displayLevel =
    calibratedPct !== null && Number.isFinite(calibratedPct)
      ? Math.min(100, Math.max(0, calibratedPct))
      : null;

  const tankHasData = displayLevel !== null;

  /*
   * Never allow undefined/null into the tank calculations.
   */
  const scaledTankLevel = tankHasData ? displayLevel : 0;

  /* ============================================================
     HISTORY
     ============================================================ */

  const tankHistory = getHistory("RO5-FeedTankLevel");

  /* ============================================================
     TANK DEFINITIONS
     ============================================================ */

  const feedTanks = useMemo(() => {
    const now = new Date();

    /*
     * MAIN FEED TANK A
     *
     * This is the REAL physical tank connected to:
     *
     * RO5-FeedTankLevelRaw
     *
     * Its percentage is therefore the authoritative
     * Feed Tank Management percentage.
     */

    const tankALevel = scaledTankLevel;

    /*
     * TANK B
     *
     * There is currently no independent RAW transmitter
     * supplied for Tank B.
     *
     * Therefore this remains a derived placeholder only.
     *
     * IMPORTANT:
     * Tank B is NOT used when calculating the overall
     * Feed Tank Level.
     */

    const tankBLevel =
      scaledTankLevel === 0
        ? 0
        : Math.min(
            100,
            Math.max(0, scaledTankLevel * 0.85 + 2)
          );

    /* ------------------------------------------------------------
       STATUS
       ------------------------------------------------------------ */

    const getStatus = (level, hasData) => {
      if (!hasData) return "Offline";

      if (level <= 0) return "Empty";

      if (level > 70) return "Active";

      if (level > 40) return "Standby";

      if (level > 15) return "Warning";

      return "Empty";
    };

    /* ------------------------------------------------------------
       HEALTH
       ------------------------------------------------------------ */

    const getHealth = (level, hasData) => {
      if (!hasData) return 0;

      const baseHealth = (level / 100) * 70 + 30;

      const recoveryBonus = Math.min(
        20,
        (recovery / 100) * 20
      );

      return Math.min(
        100,
        baseHealth +
          recoveryBonus -
          (stage1Delta > 0.5 ? 10 : 0)
      );
    };

    return [
      {
        id: "FT-A",

        name: "Main Feed Tank A",

        location: "North Plant",

        status: getStatus(
          tankALevel,
          tankHasData
        ),

        level: tankALevel,

        capacity: 500,

        volume:
          (tankALevel / 100) * 500,

        dailyConsumption: tankHasData
          ? feedFlow * 24 * 0.4
          : 0,

        monthlyConsumption: tankHasData
          ? feedFlow * 24 * 30 * 0.4
          : 0,

        health: getHealth(
          tankALevel,
          tankHasData
        ),

        lastMaintenance: format(
          subDays(now, 45),
          "yyyy-MM-dd"
        ),

        nextMaintenance: format(
          subDays(now, -15),
          "yyyy-MM-dd"
        ),
      },

      {
        id: "FT-B",

        name: "Flush Tank",

        location: "East Plant",

        status: getStatus(
          tankBLevel,
          tankHasData
        ),

        level: tankBLevel,

        capacity: 400,

        volume:
          (tankBLevel / 100) * 400,

        dailyConsumption: tankHasData
          ? feedFlow * 24 * 0.35
          : 0,

        monthlyConsumption: tankHasData
          ? feedFlow * 24 * 30 * 0.35
          : 0,

        health: getHealth(
          tankBLevel,
          tankHasData
        ),

        lastMaintenance: format(
          subDays(now, 30),
          "yyyy-MM-dd"
        ),

        nextMaintenance: format(
          subDays(now, -20),
          "yyyy-MM-dd"
        ),
      },
    ];
  }, [
    scaledTankLevel,
    tankHasData,
    feedFlow,
    recovery,
    stage1Delta,
  ]);

  /* ============================================================
     SELECT FIRST TANK
     ============================================================ */

  useEffect(() => {
    if (feedTanks.length > 0 && !selected) {
      setSelected(feedTanks[0]);
    }
  }, [feedTanks, selected]);

  /* ============================================================
     KEEP SELECTED TANK UPDATED
     ============================================================ */

  useEffect(() => {
    if (!selected) return;

    const updated = feedTanks.find(
      (t) => t.id === selected.id
    );

    if (updated && updated !== selected) {
      setSelected(updated);
    }
  }, [feedTanks, selected]);

  /* ============================================================
     FILTERED TANKS
     ============================================================ */

  const filteredTanks = useMemo(() => {
    if (filterStatus === "All") {
      return feedTanks;
    }

    return feedTanks.filter(
      (t) => t.status === filterStatus
    );
  }, [feedTanks, filterStatus]);

  /* ============================================================
     CONSUMPTION HISTORY
     ============================================================ */

  const tankHistoryData = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const currentMonth = new Date().getMonth();

    return months.slice(0, 6).map((month, i) => {
      const monthIndex =
        (currentMonth - 5 + i + 12) % 12;

      const monthName = months[monthIndex];

      let consumption =
        30000 + Math.random() * 5000;

      if (
        tankHistory &&
        tankHistory.length > 0
      ) {
        const numericHistory =
          tankHistory.filter(
            (d) => Number.isFinite(Number(d.value))
          );

        if (numericHistory.length > 0) {
          const avgLevel =
            numericHistory.reduce(
              (sum, d) =>
                sum + Number(d.value),
              0
            ) / numericHistory.length;

          consumption =
            avgLevel *
            100 *
            (0.8 + Math.random() * 0.4);
        }
      }

      return {
        month: monthName,
        consumption: Math.round(consumption),
      };
    });
  }, [tankHistory]);

  /* ============================================================
     FILTER OPTIONS
     ============================================================ */

  const statusFilters = [
    "All",
    "Active",
    "Standby",
    "Warning",
    "Empty",
    "Maintenance",
  ];

  /* ============================================================
     OVERALL TANK INFORMATION
     ============================================================

     IMPORTANT:

     Tank B is currently a derived placeholder and has no
     independent transmitter.

     Therefore the overall Feed Tank level MUST NOT average
     Tank A and Tank B.

     The Dashboard is displaying the real Feed Tank sensor,
     so the overall value here is also Tank A's real calibrated
     value.

     This is what makes the two pages agree.
     ============================================================ */

  const mainFeedTank = feedTanks.find(
    (tank) => tank.id === "FT-A"
  );

  const totalCapacity =
    mainFeedTank?.capacity || 0;

  const totalVolume =
    mainFeedTank?.volume || 0;

  const overallLevel = tankHasData
    ? scaledTankLevel
    : 0;

  /* ============================================================
     TANK SELECT
     ============================================================ */

  const handleTankSelect = (tank) => {
    setSelected(tank);

    if (isMobile) {
      setShowDetail(true);
    }
  };

  /* ============================================================
     BACK BUTTON
     ============================================================ */

  const handleBack = () => {
    setShowDetail(false);
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="flex h-full overflow-hidden flex-col md:flex-row">

      {/* ========================================================
          LEFT / MAIN AREA
          ======================================================== */}

      <div
        className={`flex flex-col flex-1 min-w-0 overflow-auto p-2 sm:p-4 ${
          isMobile && showDetail ? "hidden" : "flex"
        }`}
        style={{
          scrollbarWidth: "none",
        }}
      >

        {/* ======================================================
            HEADER
            ====================================================== */}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-3 gap-2">

          <div>

            <h2
              style={{
                fontSize: isMobile ? 10 : 11,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              <Droplet
                size={isMobile ? 12 : 14}
                style={{
                  display: "inline",
                  marginRight: 4,
                }}
              />

              Feed Tank Overview ·{" "}
              {feedTanks.length} Tanks
            </h2>

            <div
              style={{
                fontSize: isMobile ? 8 : 10,
                color: "var(--muted-foreground)",
                marginTop: 2,
              }}
            >
              Total Capacity:{" "}
              {totalCapacity.toLocaleString()} m³
              {" · "}
              Current Volume:{" "}
              {totalVolume.toFixed(0)} m³
              {" · "}
              Overall Level:{" "}

              <span
                style={{
                  color: !tankHasData
                    ? "#64748b"
                    : overallLevel > 50
                      ? "#22c55e"
                      : overallLevel > 25
                        ? "#eab308"
                        : "#ef4444",

                  fontWeight: 600,
                }}
              >
                {tankHasData
                  ? `${overallLevel.toFixed(1)}%`
                  : "No Data"}
              </span>

              {!isMobile && (
                <span
                  style={{
                    fontSize: 9,
                    color:
                      "var(--muted-foreground)",
                    marginLeft: 8,
                  }}
                >
                  (
                  Raw:{" "}
                  {hasRawTankReading
                    ? rawTankNum.toFixed(3)
                    : "--"}

                  {" → "}

                  {hasRawTankReading &&
                  calibratedPct !== null
                    ? calibratedPct.toFixed(1)
                    : "--"}
                  %)
                </span>
              )}
            </div>

          </div>

          {/* ====================================================
              FILTERS
              ==================================================== */}

          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">

            <Filter
              size={isMobile ? 10 : 12}
              style={{
                color:
                  "var(--muted-foreground)",
              }}
            />

            {statusFilters.map((f) => (
              <button
                key={f}
                onClick={() =>
                  setFilterStatus(f)
                }
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs transition-colors"
                style={{
                  background:
                    filterStatus === f
                      ? "#0ea5e9"
                      : "var(--secondary)",

                  color:
                    filterStatus === f
                      ? "white"
                      : "var(--muted-foreground)",

                  border:
                    "1px solid var(--border)",

                  fontSize: isMobile ? 7 : 9,

                  cursor: "pointer",

                  whiteSpace: "nowrap",
                }}
              >
                {isMobile && f !== "All"
                  ? f.charAt(0)
                  : f}
              </button>
            ))}

            <span
              style={{
                fontSize: isMobile ? 7 : 9,
                color:
                  "var(--muted-foreground)",
                marginLeft: 2,
              }}
            >
              {filteredTanks.length} shown
            </span>

          </div>

        </div>

        {/* ======================================================
            TANK TABLE
            ====================================================== */}

        <div
          className="rounded overflow-hidden"
          style={{
            border:
              "1px solid var(--border)",
            flex: 1,
          }}
        >

          <div
            style={{
              overflowX: "auto",
            }}
          >

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: isMobile
                  ? 500
                  : "auto",
              }}
            >

              <thead>

                <tr
                  style={{
                    background:
                      "var(--muted)",
                  }}
                >

                  {isMobile ? (
                    <>
                      <th
                        style={{
                          padding:
                            "6px 8px",
                          textAlign: "left",
                          fontSize: 8,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      >
                        ID
                      </th>

                      <th
                        style={{
                          padding:
                            "6px 8px",
                          textAlign: "left",
                          fontSize: 8,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      >
                        Status
                      </th>

                      <th
                        style={{
                          padding:
                            "6px 8px",
                          textAlign: "right",
                          fontSize: 8,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      >
                        Level
                      </th>

                      <th
                        style={{
                          padding:
                            "6px 8px",
                          textAlign: "right",
                          fontSize: 8,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      >
                        Volume
                      </th>

                      <th
                        style={{
                          padding:
                            "6px 8px",
                          textAlign: "right",
                          fontSize: 8,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      >
                        Consumption
                      </th>

                      <th
                        style={{
                          padding:
                            "6px 8px",
                          textAlign: "center",
                          fontSize: 8,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      >
                        Health
                      </th>

                      <th
                        style={{
                          padding:
                            "6px 8px",
                          textAlign: "center",
                          fontSize: 8,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <th
                        style={{
                          padding:
                            "8px 10px",
                          textAlign: "left",
                          fontSize: 9,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          letterSpacing:
                            "0.08em",
                          textTransform:
                            "uppercase",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      >
                        ID
                      </th>

                      <th
                        style={{
                          padding:
                            "8px 10px",
                          textAlign: "left",
                          fontSize: 9,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          letterSpacing:
                            "0.08em",
                          textTransform:
                            "uppercase",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      >
                        Name
                      </th>

                      <th
                        style={{
                          padding:
                            "8px 10px",
                          textAlign: "left",
                          fontSize: 9,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          letterSpacing:
                            "0.08em",
                          textTransform:
                            "uppercase",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      >
                        Location
                      </th>

                      <th
                        style={{
                          padding:
                            "8px 10px",
                          textAlign: "left",
                          fontSize: 9,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          letterSpacing:
                            "0.08em",
                          textTransform:
                            "uppercase",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      >
                        Status
                      </th>

                      <th
                        style={{
                          padding:
                            "8px 10px",
                          textAlign: "left",
                          fontSize: 9,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          letterSpacing:
                            "0.08em",
                          textTransform:
                            "uppercase",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      >
                        Level
                      </th>

                      <th
                        style={{
                          padding:
                            "8px 10px",
                          textAlign: "left",
                          fontSize: 9,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          letterSpacing:
                            "0.08em",
                          textTransform:
                            "uppercase",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      >
                        Volume
                      </th>

                      <th
                        style={{
                          padding:
                            "8px 10px",
                          textAlign: "left",
                          fontSize: 9,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          letterSpacing:
                            "0.08em",
                          textTransform:
                            "uppercase",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      >
                        Capacity
                      </th>

                      <th
                        style={{
                          padding:
                            "8px 10px",
                          textAlign: "left",
                          fontSize: 9,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          letterSpacing:
                            "0.08em",
                          textTransform:
                            "uppercase",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      >
                        Consumption
                      </th>

                      <th
                        style={{
                          padding:
                            "8px 10px",
                          textAlign: "left",
                          fontSize: 9,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          letterSpacing:
                            "0.08em",
                          textTransform:
                            "uppercase",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      >
                        Health
                      </th>

                      <th
                        style={{
                          padding:
                            "8px 10px",
                          textAlign: "center",
                          fontSize: 9,
                          fontWeight: 600,
                          color:
                            "var(--muted-foreground)",
                          letterSpacing:
                            "0.08em",
                          textTransform:
                            "uppercase",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      />
                    </>
                  )}

                </tr>

              </thead>

              <tbody>

                {filteredTanks.map((t, i) => (
                  <tr
                    key={t.id}
                    onClick={() =>
                      handleTankSelect(t)
                    }
                    className="cursor-pointer transition-colors"
                    style={{
                      background:
                        selected?.id === t.id
                          ? "rgba(14,165,233,0.06)"
                          : i % 2 === 0
                            ? "var(--card)"
                            : "var(--muted)",

                      borderLeft:
                        selected?.id === t.id
                          ? "2px solid #0ea5e9"
                          : "2px solid transparent",
                    }}
                  >

                    {isMobile ? (
                      <>
                        <td
                          style={{
                            padding:
                              "5px 8px",
                            fontSize: 10,
                            fontFamily:
                              "var(--font-mono)",
                            color: "#0ea5e9",
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          {t.id}
                        </td>

                        <td
                          style={{
                            padding:
                              "5px 8px",
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          <StatusBadge
                            status={t.status}
                          />
                        </td>

                        <td
                          style={{
                            padding:
                              "5px 8px",
                            fontSize: 10,
                            fontFamily:
                              "var(--font-mono)",
                            fontWeight: 600,
                            textAlign: "right",
                            color:
                              !tankHasData
                                ? "#64748b"
                                : t.level > 50
                                  ? "#22c55e"
                                  : t.level > 25
                                    ? "#eab308"
                                    : "#ef4444",
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          {tankHasData
                            ? `${t.level.toFixed(0)}%`
                            : "--"}
                        </td>

                        <td
                          style={{
                            padding:
                              "5px 8px",
                            fontSize: 10,
                            fontFamily:
                              "var(--font-mono)",
                            textAlign: "right",
                            color:
                              "var(--foreground)",
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          {tankHasData
                            ? t.volume.toFixed(0)
                            : "--"}
                        </td>

                        <td
                          style={{
                            padding:
                              "5px 8px",
                            fontSize: 10,
                            fontFamily:
                              "var(--font-mono)",
                            textAlign: "right",
                            color:
                              "var(--foreground)",
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          {tankHasData
                            ? t.dailyConsumption.toFixed(
                                0
                              )
                            : "--"}
                        </td>

                        <td
                          style={{
                            padding:
                              "5px 8px",
                            textAlign: "center",
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          <HealthBar
                            value={t.health}
                          />
                        </td>

                        <td
                          style={{
                            padding:
                              "5px 8px",
                            textAlign: "center",
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          <ChevronRight
                            size={14}
                            style={{
                              color:
                                "var(--muted-foreground)",
                            }}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td
                          style={{
                            padding:
                              "7px 10px",
                            fontSize: 11,
                            fontFamily:
                              "var(--font-mono)",
                            color: "#0ea5e9",
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          {t.id}
                        </td>

                        <td
                          style={{
                            padding:
                              "7px 10px",
                            fontSize: 11,
                            color:
                              "var(--foreground)",
                            fontWeight: 500,
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          {t.name}
                        </td>

                        <td
                          style={{
                            padding:
                              "7px 10px",
                            fontSize: 10,
                            color:
                              "var(--muted-foreground)",
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <MapPin size={9} />
                            {t.location}
                          </div>
                        </td>

                        <td
                          style={{
                            padding:
                              "7px 10px",
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          <StatusBadge
                            status={t.status}
                          />
                        </td>

                        <td
                          style={{
                            padding:
                              "7px 10px",
                            fontSize: 11,
                            fontFamily:
                              "var(--font-mono)",
                            fontWeight: 600,
                            color:
                              !tankHasData
                                ? "#64748b"
                                : t.level > 50
                                  ? "#22c55e"
                                  : t.level > 25
                                    ? "#eab308"
                                    : "#ef4444",
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          {tankHasData
                            ? `${t.level.toFixed(1)}%`
                            : "--"}
                        </td>

                        <td
                          style={{
                            padding:
                              "7px 10px",
                            fontSize: 11,
                            fontFamily:
                              "var(--font-mono)",
                            color:
                              "var(--foreground)",
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          {tankHasData
                            ? t.volume.toFixed(0)
                            : "--"}
                        </td>

                        <td
                          style={{
                            padding:
                              "7px 10px",
                            fontSize: 11,
                            fontFamily:
                              "var(--font-mono)",
                            color:
                              "var(--muted-foreground)",
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          {t.capacity}
                        </td>

                        <td
                          style={{
                            padding:
                              "7px 10px",
                            fontSize: 11,
                            fontFamily:
                              "var(--font-mono)",
                            color:
                              "var(--foreground)",
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          {tankHasData
                            ? `${t.dailyConsumption.toFixed(
                                0
                              )} m³/day`
                            : "--"}
                        </td>

                        <td
                          style={{
                            padding:
                              "7px 10px",
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          <HealthBar
                            value={t.health}
                          />
                        </td>

                        <td
                          style={{
                            padding:
                              "7px 10px",
                            textAlign: "center",
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          <ChevronRight
                            size={12}
                            style={{
                              color:
                                "var(--muted-foreground)",
                            }}
                          />
                        </td>
                      </>
                    )}

                  </tr>
                ))}

                {filteredTanks.length === 0 && (
                  <tr>
                    <td
                      colSpan={
                        isMobile ? 7 : 10
                      }
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color:
                          "var(--muted-foreground)",
                        fontSize: 11,
                      }}
                    >
                      No tanks found with status:{" "}
                      {filterStatus}
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* ======================================================
            DAILY CONSUMPTION
            ====================================================== */}

        <div
          className="rounded p-3 mt-4"
          style={{
            background: "var(--card)",
            border:
              "1px solid var(--border)",
          }}
        >

          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">

            <h3
              style={{
                fontSize: isMobile ? 10 : 11,
                fontWeight: 600,
                color:
                  "var(--muted-foreground)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Daily Consumption by Tank
            </h3>

            <span
              style={{
                fontSize: isMobile ? 8 : 9,
                color:
                  "var(--muted-foreground)",
              }}
            >
              Based on real-time feed flow data
            </span>

          </div>

          <ResponsiveContainer
            width="100%"
            height={isMobile ? 120 : 150}
          >

            <BarChart
              data={filteredTanks.filter(
                (t) =>
                  t.dailyConsumption > 0
              )}
              margin={{
                top: 4,
                right: 4,
                left: -10,
                bottom: 0,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(14,165,233,0.06)"
                vertical={false}
              />

              <XAxis
                dataKey="id"
                tick={{
                  fontSize: isMobile
                    ? 8
                    : 9,
                  fill: "#4d7a9e",
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fontSize: isMobile
                    ? 8
                    : 9,
                  fill: "#4d7a9e",
                  fontFamily:
                    "var(--font-mono)",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v + " m³"
                }
              />

              <Tooltip
                content={<CustomTooltip />}
              />

              <Bar
                dataKey="dailyConsumption"
                fill="#06b6d4"
                radius={[
                  3,
                  3,
                  0,
                  0,
                ]}
                name="Daily Consumption (m³)"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* ========================================================
          DETAIL PANEL
          ======================================================== */}

      {selected && (
        <div
          className={`flex flex-col overflow-auto p-3 sm:p-4 gap-3 sm:gap-4 ${
            isMobile
              ? "fixed inset-0 z-50"
              : ""
          }`}
          style={{
            width: isMobile
              ? "100%"
              : 280,

            background:
              "var(--muted)",

            borderLeft: isMobile
              ? "none"
              : "1px solid var(--border)",

            flexShrink: 0,

            display:
              isMobile && !showDetail
                ? "none"
                : "flex",
          }}
        >

          {/* ====================================================
              MOBILE BACK
              ==================================================== */}

          {isMobile && (
            <button
              onClick={handleBack}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 0",
                background: "none",
                border: "none",
                color:
                  "var(--muted-foreground)",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              <ChevronLeft size={18} />
              Back to Tanks
            </button>
          )}

          {/* ====================================================
              TANK HEADER
              ==================================================== */}

          <div>

            <div className="flex items-center justify-between mb-1">

              <span
                style={{
                  fontFamily:
                    "var(--font-mono)",
                  fontSize: isMobile
                    ? 18
                    : 16,
                  fontWeight: 700,
                  color: "#0ea5e9",
                }}
              >
                {selected.id}
              </span>

              <StatusBadge
                status={selected.status}
              />

            </div>

            <div
              style={{
                fontSize: isMobile
                  ? 15
                  : 13,
                fontWeight: 600,
                color:
                  "var(--foreground)",
                marginBottom: 2,
              }}
            >
              {selected.name}
            </div>

            <div
              className="flex items-center gap-1"
              style={{
                fontSize: 10,
                color:
                  "var(--muted-foreground)",
              }}
            >
              <MapPin size={9} />
              {selected.location}
            </div>

            <div
              style={{
                fontSize: 9,
                color:
                  "var(--muted-foreground)",
                marginTop: 2,
              }}
            >
              Updated:{" "}
              {lastUpdate
                ? format(
                    new Date(lastUpdate),
                    "HH:mm:ss"
                  )
                : "--"}
            </div>

          </div>

          {/* ====================================================
              TANK LEVEL CARD
              ==================================================== */}

          <div
            className="rounded p-3"
            style={{
              background:
                "var(--card)",
              border:
                "1px solid var(--border)",
            }}
          >

            <div
              style={{
                fontSize: 9,
                color:
                  "var(--muted-foreground)",
                textTransform:
                  "uppercase",
                letterSpacing:
                  "0.06em",
                marginBottom: 6,
              }}
            >
              Tank Level
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >

              <div
                style={{
                  flex: 1,
                  height: 8,
                  background:
                    "var(--secondary)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${
                      tankHasData
                        ? Math.min(
                            selected.level,
                            100
                          )
                        : 0
                    }%`,

                    height: "100%",

                    background:
                      !tankHasData
                        ? "#64748b"
                        : selected.level >
                            50
                          ? "#22c55e"
                          : selected.level >
                              25
                            ? "#eab308"
                            : "#ef4444",

                    borderRadius: 4,

                    transition:
                      "width 0.5s ease",
                  }}
                />
              </div>

              <span
                style={{
                  fontSize: isMobile
                    ? 18
                    : 16,

                  fontFamily:
                    "var(--font-mono)",

                  fontWeight: 700,

                  color:
                    !tankHasData
                      ? "#64748b"
                      : selected.level >
                          50
                        ? "#22c55e"
                        : selected.level >
                            25
                          ? "#eab308"
                          : "#ef4444",
                }}
              >
                {tankHasData
                  ? `${selected.level.toFixed(
                      0
                    )}%`
                  : "--"}
              </span>

            </div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                marginTop: 4,
              }}
            >

              <span
                style={{
                  fontSize: 8,
                  color:
                    "var(--muted-foreground)",
                }}
              >
                {tankHasData
                  ? `${selected.volume.toFixed(
                      0
                    )} m³`
                  : "--"}
              </span>

              <span
                style={{
                  fontSize: 8,
                  color:
                    "var(--muted-foreground)",
                }}
              >
                Capacity:{" "}
                {selected.capacity} m³
              </span>

            </div>

          </div>

          {/* ====================================================
              METRICS
              ==================================================== */}

          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns:
                "1fr 1fr",
            }}
          >

            {[
              {
                label:
                  "Daily Consumption",

                value: tankHasData
                  ? `${selected.dailyConsumption.toFixed(
                      0
                    )} m³`
                  : "--",
              },

              {
                label:
                  "Monthly Usage",

                value: tankHasData
                  ? `${Math.round(
                      selected.monthlyConsumption
                    ).toLocaleString()} m³`
                  : "--",
              },

              {
                label:
                  "Health Score",

                value: tankHasData
                  ? `${Math.round(
                      selected.health
                    )}%`
                  : "--",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded p-2"
                style={{
                  background:
                    "var(--card)",
                  border:
                    "1px solid var(--border)",
                }}
              >

                <div
                  style={{
                    fontSize: isMobile
                      ? 8
                      : 9,
                    color:
                      "var(--muted-foreground)",
                    marginBottom: 4,
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.06em",
                  }}
                >
                  {m.label}
                </div>

                <div
                  style={{
                    fontSize: isMobile
                      ? 14
                      : 13,
                    fontFamily:
                      "var(--font-mono)",
                    fontWeight: 700,
                    color:
                      "var(--foreground)",
                  }}
                >
                  {m.value}
                </div>

              </div>
            ))}

          </div>

          {/* ====================================================
              CONSUMPTION HISTORY
              ==================================================== */}

          <div
            className="rounded p-2"
            style={{
              background:
                "var(--card)",
              border:
                "1px solid var(--border)",
            }}
          >

            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color:
                  "var(--muted-foreground)",
                marginBottom: 8,
                textTransform:
                  "uppercase",
                letterSpacing:
                  "0.08em",
              }}
            >
              Consumption History
            </div>

            <ResponsiveContainer
              width="100%"
              height={isMobile ? 100 : 90}
            >

              <LineChart
                data={tankHistoryData}
                margin={{
                  top: 4,
                  right: 4,
                  left: -28,
                  bottom: 0,
                }}
              >

                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 8,
                    fill: "#4d7a9e",
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fontSize: 8,
                    fill: "#4d7a9e",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    (v / 1000).toFixed(0) +
                    "k"
                  }
                />

                <Tooltip
                  content={
                    <CustomTooltip />
                  }
                />

                <Line
                  type="monotone"
                  dataKey="consumption"
                  stroke="#06b6d4"
                  strokeWidth={1.5}
                  dot={{
                    r: 2,
                    fill: "#06b6d4",
                  }}
                  name="Consumption"
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

          {/* ====================================================
              MAINTENANCE
              ==================================================== */}

          <div
            className="rounded p-3"
            style={{
              background:
                "var(--card)",
              border:
                "1px solid var(--border)",
            }}
          >

            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color:
                  "var(--muted-foreground)",
                marginBottom: 8,
                textTransform:
                  "uppercase",
                letterSpacing:
                  "0.08em",
              }}
            >
              <Wrench
                size={12}
                style={{
                  display: "inline",
                  marginRight: 4,
                }}
              />

              Maintenance
            </div>

            <div className="flex flex-col gap-2">

              <div className="flex justify-between">

                <span
                  style={{
                    fontSize: 10,
                    color:
                      "var(--muted-foreground)",
                  }}
                >
                  Last Service
                </span>

                <span
                  style={{
                    fontSize: 10,
                    fontFamily:
                      "var(--font-mono)",
                    color:
                      "var(--foreground)",
                  }}
                >
                  {selected.lastMaintenance}
                </span>

              </div>

              <div className="flex justify-between">

                <span
                  style={{
                    fontSize: 10,
                    color:
                      "var(--muted-foreground)",
                  }}
                >
                  Next Due
                </span>

                <span
                  style={{
                    fontSize: 10,
                    fontFamily:
                      "var(--font-mono)",
                    color: "#eab308",
                  }}
                >
                  {selected.nextMaintenance}
                </span>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default FeedTankManagement;