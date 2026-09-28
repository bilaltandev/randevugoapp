export interface HeroRealtimeStats {
  isOpenToday: boolean;
  isOpenNow: boolean;
  openStatusText: string;
  todayWorkingHoursText: string;
  remainingSlotsCount: number;
  remainingSlotsText: string;
  firstAvailableTime: string | null;
  firstAvailableText: string;
}

export function calculateHeroStats({
  workingHours = [],
  appointments = [],
  services = [],
  employees = [],
  customNow,
}: {
  workingHours?: any[];
  appointments?: any[];
  services?: any[];
  employees?: any[];
  customNow?: Date;
}): HeroRealtimeStats {
  const now = customNow || new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday ...
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Find business working hours for today (overall business hours where employeeId is null or first match)
  const todayWh =
    workingHours.find((w) => w.dayOfWeek === dayOfWeek && !w.employeeId) ||
    workingHours.find((w) => w.dayOfWeek === dayOfWeek);

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const minutesToTime = (min: number) => {
    const h = Math.floor(min / 60)
      .toString()
      .padStart(2, "0");
    const m = (min % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  // 1. Is Open Today & Working Hours
  let isOpenToday = false;
  let isOpenNow = false;
  let openStatusText = "Bugün Kapalı";
  let todayWorkingHoursText = "Bugün Kapalı";

  if (todayWh && todayWh.isOpen) {
    isOpenToday = true;
    const openMin = timeToMinutes(todayWh.openTime || "09:00");
    const closeMin = timeToMinutes(todayWh.closeTime || "19:00");
    const breakStartMin = todayWh.breakStartTime ? timeToMinutes(todayWh.breakStartTime) : null;
    const breakEndMin = todayWh.breakEndTime ? timeToMinutes(todayWh.breakEndTime) : null;

    todayWorkingHoursText = `Bugün: ${todayWh.openTime || "09:00"} - ${todayWh.closeTime || "19:00"}`;

    if (currentMinutes < openMin) {
      isOpenNow = false;
      openStatusText = `Şu an Kapalı • Açılış: ${todayWh.openTime || "09:00"}`;
    } else if (currentMinutes >= closeMin) {
      isOpenNow = false;
      openStatusText = `Bugün Kapandı (Kapanış: ${todayWh.closeTime || "19:00"})`;
    } else {
      // In working hours, check break
      if (
        breakStartMin !== null &&
        breakEndMin !== null &&
        currentMinutes >= breakStartMin &&
        currentMinutes < breakEndMin
      ) {
        isOpenNow = false;
        openStatusText = `Molada • Dönüş: ${todayWh.breakEndTime}`;
      } else {
        isOpenNow = true;
        openStatusText = `Şu an Açık • Kapanış: ${todayWh.closeTime || "19:00"}`;
      }
    }
  }

  // 2. Real Slot Calculation (Taking into account actual appointments, employee capacity, and blocked slots)
  let remainingSlotsCount = 0;
  let firstAvailableTime: string | null = null;
  let remainingSlotsText = "Bugün Dolu";
  let firstAvailableText = "Bugün Dolu";

  if (isOpenToday && todayWh) {
    const openMin = timeToMinutes(todayWh.openTime || "09:00");
    const closeMin = timeToMinutes(todayWh.closeTime || "19:00");
    const breakStartMin = todayWh.breakStartTime ? timeToMinutes(todayWh.breakStartTime) : null;
    const breakEndMin = todayWh.breakEndTime ? timeToMinutes(todayWh.breakEndTime) : null;

    // Minimum service duration (defaults to 30)
    const validDurations = services.map((s) => s.durationMinutes).filter(Boolean);
    const minDuration = validDurations.length > 0 ? Math.min(...validDurations) : 30;
    const step = 30;

    // Active employees count (at least 1 for business capacity)
    const activeStaffCount = Math.max(1, employees.filter((e) => e.isActive !== false).length);

    // Active appointments for today
    const validAppointments = appointments.filter(
      (a) => a.status === "PENDING" || a.status === "CONFIRMED" || a.isBlockedSlot === true
    );

    const availableSlots: string[] = [];

    for (let slotStart = openMin; slotStart + minDuration <= closeMin; slotStart += step) {
      const slotEnd = slotStart + minDuration;

      // Skip past hours (give 15 mins buffer)
      if (slotStart <= currentMinutes + 15) {
        continue;
      }

      // Skip break time
      if (
        breakStartMin !== null &&
        breakEndMin !== null &&
        slotStart < breakEndMin &&
        slotEnd > breakStartMin
      ) {
        continue;
      }

      // Check overlap with appointments
      let overlappingCount = 0;
      for (const appt of validAppointments) {
        const apptStart = timeToMinutes(appt.startTime);
        const apptEnd = timeToMinutes(appt.endTime);
        if (slotStart < apptEnd && slotEnd > apptStart) {
          overlappingCount++;
        }
      }

      // If overlapping count is less than staff capacity, slot is free!
      if (overlappingCount < activeStaffCount) {
        availableSlots.push(minutesToTime(slotStart));
      }
    }

    remainingSlotsCount = availableSlots.length;
    firstAvailableTime = availableSlots[0] || null;

    if (remainingSlotsCount > 0) {
      remainingSlotsText = `Bugün ${remainingSlotsCount} Boş Randevu`;
    } else {
      remainingSlotsText = "Bugün Randevular Dolu";
    }

    if (firstAvailableTime) {
      firstAvailableText = `İlk Müsait Saat: ${firstAvailableTime}`;
    } else {
      firstAvailableText = "Bugün Müsait Saat Yok";
    }
  }

  return {
    isOpenToday,
    isOpenNow,
    openStatusText,
    todayWorkingHoursText,
    remainingSlotsCount,
    remainingSlotsText,
    firstAvailableTime,
    firstAvailableText,
  };
}
