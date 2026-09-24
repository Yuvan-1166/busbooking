// Utility to generate trip dates based on operating days and date range
export function generateTripDates(fromDate, toDate, operatingDays) {
  const dates = [];
  const current = new Date(fromDate);
  const end = new Date(toDate);

  // Ensure dates are at start of day (00:00:00)
  current.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const dayMap = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat",
  };

  while (current <= end) {
    const dayName = dayMap[current.getDay()];
    
    // Check if this day is in operating days
    if (operatingDays[dayName]) {
      // Format as YYYY-MM-DD
      const dateStr = current.toISOString().split("T")[0];
      dates.push(dateStr);
    }

    // Move to next day
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// Validate trip generation parameters
export function validateTripGeneration(fromDate, toDate, operatingDays) {
  const errors = [];

  if (!fromDate) {
    errors.push("From date is required.");
  }
  if (!toDate) {
    errors.push("Until date is required.");
  }

  if (fromDate && toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (from > to) {
      errors.push("From date cannot be after until date.");
    }
  }

  const hasOperatingDay = Object.values(operatingDays).some((val) => val);
  if (!hasOperatingDay) {
    errors.push("At least one operating day must be selected.");
  }

  return errors;
}

// Format operating days for display
export function formatOperatingDays(operatingDays) {
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const selected = days.filter((day) => operatingDays[day]);
  
  if (selected.length === 7) {
    return "Every day";
  }
  if (selected.length === 5 && !operatingDays.sat && !operatingDays.sun) {
    return "Weekdays (Mon-Fri)";
  }
  if (selected.length === 2 && operatingDays.sat && operatingDays.sun) {
    return "Weekends (Sat-Sun)";
  }

  return selected.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ");
}
