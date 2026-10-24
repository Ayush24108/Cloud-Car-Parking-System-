# Backend Business Rules — CloudPark

## 1. Purpose

This document defines the business rules enforced by the Java backend of CloudPark, a cloud-enabled parking management system. These rules apply to parking availability, bookings, vehicle entry and exit, billing, payments, and administration.

**Status:** Initial proposal — requires team review before implementation.

## 2. User Roles

The system will support the following roles:

- **USER:** View parking locations, check availability, book parking slots, cancel eligible bookings, view parking history, and view payment records.
- **ADMIN:** Manage parking locations and slots, view bookings and parking sessions, and perform authorized administrative operations.

The backend must verify permissions for protected operations. Hiding a button in the frontend is not sufficient authorization.

## 3. Parking Slot Rules

Each parking slot must belong to exactly one parking location.

A slot can have one of the following statuses:

- `AVAILABLE` — available for allocation.
- `RESERVED` — allocated to a valid booking.
- `OCCUPIED` — a vehicle is currently parked in the slot.
- `MAINTENANCE` — unavailable for booking or allocation.

Rules:

1. A slot under maintenance cannot be booked or allocated.
2. A slot cannot have two overlapping active bookings.
3. A slot cannot accommodate more than one active parking session.
4. Slot status must be updated by the backend after successful operations.
5. Users cannot directly modify slot status through unrestricted requests.
6. A parking slot cannot be deleted while it has an active booking or parking session.

## 4. Booking Rules

1. A booking must reference an existing user, parking location, and valid parking slot.
2. The booking must have a start time and end time.
3. The start time must be earlier than the end time.
4. A booking cannot be created for a slot under maintenance.
5. Two bookings for the same slot must not overlap when both are active.
6. Availability must be checked again when a booking is submitted; the availability shown on the frontend may have become outdated.
7. Booking creation must be atomic. If the booking fails, the system must not leave the slot incorrectly reserved.
8. Users can view and cancel only their own bookings unless they have appropriate administrative permissions.
9. A booking cannot be cancelled after its parking session has started.
10. The backend must return a clear error when a requested slot is no longer available.

### Booking Statuses

- `CONFIRMED` — booking successfully created.
- `CANCELLED` — booking cancelled successfully.
- `EXPIRED` — booking expired according to the configured reservation policy.
- `COMPLETED` — booking's parking session has finished.

**Proposed policy:** The team must decide how long a confirmed booking remains valid after its start time if the user does not arrive. The expiry period must be configurable rather than hard-coded throughout the application.

## 5. Vehicle Entry Rules

1. Entry must reference a valid booking or an explicitly supported authorized walk-in operation.
2. A confirmed booking must be valid for the requested entry.
3. A slot must not already be occupied by another active session.
4. Entry must record the actual entry timestamp using the backend's time source.
5. A successful entry must create a parking session and update the slot to `OCCUPIED`.
6. Repeated entry requests must not create duplicate active sessions.
7. An entry operation must not succeed if the booking or slot fails the required validation checks.

**MVP decision:** Walk-in parking will be supported only if the team implements and tests it. Otherwise, entry will require a confirmed booking.

## 6. Vehicle Exit Rules

1. A vehicle can exit only if a corresponding active parking session exists.
2. Exit must record the actual exit timestamp.
3. The exit timestamp cannot be earlier than the entry timestamp.
4. The backend must calculate the parking fee from the recorded entry and exit times and the applicable tariff.
5. A successful exit must complete the parking session and release the slot.
6. Repeated exit requests must not complete the same session or release the slot multiple times.
7. If billing or another required operation fails, the backend must preserve consistent session and slot states.

## 7. Billing Rules

The backend, not the frontend, is responsible for calculating parking charges.

The fee calculation must use:

- Actual entry time.
- Actual exit time.
- The tariff configured for the relevant parking location.
- The approved billing and rounding policy.

**Proposed example policy:** Charge ₹40 per started hour. For a parking duration of 2 hours and 30 minutes, the fee would be ₹120.

This is an illustrative tariff only. The team must approve the actual rate and decide how partial hours, minimum charges, and any grace period will be handled.

The calculated fee must be stored with the parking session or its associated billing record so that the amount can be audited later.

## 8. Payment Rules

1. Every payment must be associated with the appropriate booking or parking session.
2. A payment must have a unique identifier.
3. Payment statuses will be:
   - `PENDING`
   - `SUCCESS`
   - `FAILED`
   - `REFUNDED`
4. A payment can be marked `SUCCESS` only after the backend confirms the payment outcome.
5. A failed payment must not be recorded as a successful payment.
6. Duplicate requests must not accidentally create duplicate successful payments.
7. Payment records must retain the amount, status, and relevant timestamps.
8. The backend must not store raw card numbers, CVVs, or other sensitive payment credentials.

**MVP decision:** Use simulated payments unless the team explicitly decides to integrate a real payment gateway. Simulated payment results must be clearly identified as simulations.

## 9. Multiple Parking Locations

1. The system must support multiple independent parking locations.
2. Every slot must be associated with a valid parking location.
3. Availability queries must return slots belonging to the requested location only.
4. Booking, entry, exit, and billing operations must validate the relevant location and slot relationships.
5. An administrator must not accidentally modify slots belonging to an unrelated location through an incorrectly scoped operation.

## 10. Admin Rules

Authorized administrators may create and update parking locations and slots.

1. Administrative endpoints must require admin authorization.
2. Invalid slot statuses and invalid location references must be rejected.
3. A slot with an active booking or parking session must not be deleted.
4. Changes to parking configuration must not silently corrupt existing bookings or billing records.
5. Administrative actions that affect operational data should be logged.

## 11. Data Consistency and Concurrency

1. The database is the source of truth for bookings, slots, sessions, and payments.
2. Availability checks and booking creation must be protected against concurrent requests.
3. Application-level checks alone are insufficient to prevent double booking.
4. Transactions, appropriate database constraints, and/or row-level locking must be used where necessary.
5. A failed operation must not leave partially updated records.
6. Slot status and booking/session status must remain consistent.
7. All timestamps must use a consistent backend time policy; the team should standardize storage and display time zones.

## 12. Validation and Error Handling

The backend must validate incoming requests before changing persistent data.

Examples of conditions that must be rejected include:

- Invalid or missing booking times.
- Nonexistent users, locations, or slots.
- Booking an unavailable slot.
- Cancelling another user's booking without authorization.
- Starting a session for an invalid booking.
- Exiting a session that is not active.
- Submitting an invalid payment amount or payment reference.
- Calling an admin-only endpoint as a normal user.

The API must return meaningful HTTP status codes and clear error messages without exposing stack traces, credentials, or internal database details.

## 13. Security Rules

1. Protected endpoints must enforce authentication and authorization.
2. User identity must be obtained from the authenticated request context, not blindly trusted from a request body.
3. Database credentials, AWS credentials, and other secrets must not be committed to GitHub.
4. Database access must use parameterized queries or safe ORM operations.
5. Sensitive configuration must be supplied through appropriate environment or secret-management mechanisms.
6. Production database access must be restricted to authorized application infrastructure and administrators.

## 14. Decisions Requiring Team Approval

Before final implementation, the team must agree on:

- [ ] Booking expiry period and no-show policy.
- [ ] Whether walk-in parking is supported.
- [ ] Parking tariff and partial-hour rounding policy.
- [ ] Whether payment is simulated or integrated with a real gateway.
- [ ] Whether payment must succeed before a slot is released.
- [ ] Whether users can cancel bookings close to the start time.
- [ ] Whether parking tariffs vary by location.
- [ ] How administrators are created and authenticated.

## 15. Implementation Principle

Business rules must be enforced in the Java backend service layer, with database safeguards wherever necessary. Controllers should handle HTTP requests and responses; repositories should handle data access; services should implement the business logic.

The frontend must never be treated as the authority for slot availability, booking validity, parking fees, payment success, or user permissions.
