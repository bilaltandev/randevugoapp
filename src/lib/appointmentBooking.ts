import type { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { OCCUPYING_STATUSES } from "./appointmentRules";

/** A booking rule was violated; `status` and `code` go to the client unchanged. */
export class BookingError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "BookingError";
  }
}

export const EMPLOYEE_TIME_CONFLICT = "EMPLOYEE_TIME_CONFLICT";
export const NO_AVAILABLE_EMPLOYEE = "NO_AVAILABLE_EMPLOYEE";
export const TABLE_TIME_CONFLICT = "TABLE_TIME_CONFLICT";

/**
 * Runs `fn` in a transaction that holds a lock for one business and day. Every write that can create an
 * overlap (new booking, re-activating a cancelled one) goes through here, so two concurrent requests for
 * the same day are checked one after the other instead of both seeing a free slot.
 *
 * pg_advisory_xact_lock needs no schema change, is released automatically at commit/rollback, and works
 * through the Supabase transaction pooler because the whole transaction runs on one connection.
 * Different businesses or days never wait for each other.
 */
export function withBookingLock<T>(businessId: string, date: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`appointment:${businessId}:${date}`}::text, 0))`;
      return fn(tx);
    },
    { maxWait: 10_000, timeout: 15_000 }
  );
}

/** The day's appointments that occupy time (read inside the lock). */
export function occupyingAppointments(tx: Prisma.TransactionClient, businessId: string, date: string, excludeId?: string) {
  return tx.appointment.findMany({
    where: {
      businessId,
      date,
      status: { in: [...OCCUPYING_STATUSES] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, employeeId: true, tableId: true, startTime: true, endTime: true, status: true },
  });
}
