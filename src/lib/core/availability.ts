/** Pure availability engine — generates bookable slots for a resource on a date. */

export type Interval = { start: number; end: number }; // epoch ms

export type SlotState = "available" | "booked" | "blocked" | "reserved" | "past";

export type Slot = {
  start: number;
  end: number;
  durationMins: number;
  state: SlotState;
};

export type AvailabilityInput = {
  date: Date;                 // local date (midnight)
  openHour: number;
  closeHour: number;
  durationMins: number;       // slot length to generate
  stepMins?: number;          // grid step (defaults to durationMins)
  booked: Interval[];         // confirmed/checked_in bookings
  reserved: Interval[];       // live holds
  blocked: Interval[];        // maintenance blocks
  now?: number;
};

function overlaps(aStart: number, aEnd: number, list: Interval[]): boolean {
  return list.some((i) => aStart < i.end && aEnd > i.start);
}

export function generateSlots(input: AvailabilityInput): Slot[] {
  const now = input.now ?? Date.now();
  const step = input.stepMins ?? input.durationMins;
  const slots: Slot[] = [];
  const dayStart = new Date(input.date);
  dayStart.setHours(input.openHour, 0, 0, 0);
  const dayEnd = new Date(input.date);
  dayEnd.setHours(input.closeHour, 0, 0, 0);

  for (let t = dayStart.getTime(); t + input.durationMins * 60000 <= dayEnd.getTime() + 1; t += step * 60000) {
    const start = t;
    const end = t + input.durationMins * 60000;
    let state: SlotState = "available";
    if (end <= now) state = "past";
    else if (overlaps(start, end, input.blocked)) state = "blocked";
    else if (overlaps(start, end, input.booked)) state = "booked";
    else if (overlaps(start, end, input.reserved)) state = "reserved";
    slots.push({ start, end, durationMins: input.durationMins, state });
  }
  return slots;
}

export function isSlotFree(start: number, end: number, taken: Interval[]): boolean {
  return !overlaps(start, end, taken);
}
