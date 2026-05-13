# Tuition Track API Documentation

This document provides a comprehensive reference for the Tuition Track backend REST API.

## Base URL
All API requests should be prefixed with `/api`. For local development, this is typically `http://localhost:3000/api`.

## Authentication
Most endpoints are protected and require a valid JSON Web Token (JWT) to be sent in the `Authorization` header.

**Header Format:**
```
Authorization: Bearer <your_jwt_token>
```

**Roles:**
The system uses Role-Based Access Control (RBAC). The main roles are:
- `ADMIN`: Full system access.
- `TEACHER`: Access to manage their assigned classes, students, attendance, and payments.
- `STUDENT`: Read-only access to their own data (attendance, payments, enrolled classes).

---

## 1. Authentication
Endpoints for user registration, login, and profile retrieval.
**Base Path:** `/api/auth`

| Method | Endpoint | Description | Auth Required | Roles Allowed |
|---|---|---|---|---|
| POST | `/register` | Register a new user | No | Public |
| POST | `/login` | Login and receive a JWT token | No | Public |
| GET | `/me` | Get the profile of the currently logged-in user | Yes | All |

---

## 2. Students
Endpoints for managing student records.
**Base Path:** `/api/students`

| Method | Endpoint | Description | Auth Required | Roles Allowed |
|---|---|---|---|---|
| POST | `/` | Create a student account | Yes | ADMIN, TEACHER |
| GET | `/` | List students (Supports queries: `page`, `limit`, `search`) | Yes | ADMIN, TEACHER |
| GET | `/:id` | Get student details by ID | Yes | All |
| PUT | `/:id` | Update student details by ID | Yes | ADMIN, TEACHER |
| DELETE | `/:id` | Delete a student by ID | Yes | ADMIN |

---

## 3. Teachers
Endpoints for managing teacher profiles.
**Base Path:** `/api/teachers`

| Method | Endpoint | Description | Auth Required | Roles Allowed |
|---|---|---|---|---|
| POST | `/` | Create a teacher account | Yes | ADMIN |
| GET | `/` | List teachers (Supports queries: `page`, `limit`, `search`) | Yes | ADMIN |
| GET | `/:id` | Get teacher details by ID | Yes | All |
| PUT | `/:id` | Update teacher details by ID | Yes | ADMIN |
| DELETE | `/:id` | Delete a teacher by ID | Yes | ADMIN |

---

## 4. Classes
Endpoints for creating and managing classes.
**Base Path:** `/api/classes`

| Method | Endpoint | Description | Auth Required | Roles Allowed |
|---|---|---|---|---|
| POST | `/` | Create a new class | Yes | ADMIN, TEACHER |
| GET | `/` | List classes (Queries: `page`, `limit`, `search`, `teacherId`) | Yes | All |
| GET | `/:id` | Get class details by ID | Yes | All |
| PUT | `/:id` | Update class details by ID | Yes | ADMIN, TEACHER |
| DELETE | `/:id` | Delete a class by ID | Yes | ADMIN, TEACHER |
| GET | `/:id/students` | Get list of students enrolled in a specific class | Yes | All |

---

## 5. Enrollments
Endpoints for managing student enrollments in classes.
**Base Path:** `/api/enrollments`

| Method | Endpoint | Description | Auth Required | Roles Allowed |
|---|---|---|---|---|
| POST | `/` | Enroll a student in a class (Body requires `student_id`, `class_id`) | Yes | ADMIN, TEACHER |
| DELETE | `/:id` | Remove an enrollment by ID | Yes | ADMIN, TEACHER |

---

## 6. Attendance
Endpoints for recording and retrieving student attendance.
**Base Path:** `/api/attendance`

| Method | Endpoint | Description | Auth Required | Roles Allowed |
|---|---|---|---|---|
| POST | `/` | Batch record attendance for a class | Yes | ADMIN, TEACHER |
| GET | `/` | Get attendance records (Queries: `classId`, `date`) | Yes | All |
| PUT | `/:id` | Update an attendance record's status by ID | Yes | ADMIN, TEACHER |
| GET | `/student/:studentId` | Get attendance history for a student (Queries: `classId`, `from`, `to`) | Yes | All |

---

## 7. Payments
Endpoints for processing and tracking fee payments.
**Base Path:** `/api/payments`

| Method | Endpoint | Description | Auth Required | Roles Allowed |
|---|---|---|---|---|
| POST | `/` | Create a new payment record | Yes | ADMIN, TEACHER |
| GET | `/` | List payments (Queries: `page`, `limit`, `studentId`, `classId`, `status`) | Yes | All |
| GET | `/summary` | Get payment summary metrics (Filtered for TEACHER role) | Yes | ADMIN, TEACHER |
| PUT | `/:id` | Update payment status/details by ID | Yes | ADMIN, TEACHER |

---

## 8. Dashboard
Endpoints for retrieving aggregated dashboard statistics.
**Base Path:** `/api/dashboard`

| Method | Endpoint | Description | Auth Required | Roles Allowed |
|---|---|---|---|---|
| GET | `/` | Returns role-appropriate dashboard data (Admin, Teacher, or Student specific) | Yes | All |

---

## 9. Notifications
Endpoints for user notifications and alerts.
**Base Path:** `/api/notifications`

| Method | Endpoint | Description | Auth Required | Roles Allowed |
|---|---|---|---|---|
| GET | `/` | Get user's notifications (Queries: `unreadOnly=true`) | Yes | All |
| GET | `/unread-count` | Get the total count of unread notifications | Yes | All |
| PUT | `/:id/read` | Mark a specific notification as read | Yes | All |
| PUT | `/read-all` | Mark all user's notifications as read | Yes | All |
| POST | `/send-fee-reminders` | Trigger system to send fee reminders | Yes | ADMIN |

---

## Standard Response Format
All successful responses are wrapped in a standard JSON structure:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

Paginated endpoints will include metadata in the response:
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

## Error Response Format
Errors return appropriate HTTP status codes (400, 401, 403, 404, 500) and the following structure:

```json
{
  "success": false,
  "error": "Error Message or Array of Validation Errors"
}
```
