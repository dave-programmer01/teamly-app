# Teamly Frontend Integration Documentation

This document is a frontend-focused API guide for Teamly. It lists available endpoints, auth flow, expected payloads, and sample responses so web/mobile clients can integrate quickly.

## Base URL

- Local: `http://localhost:8080`
- All endpoints below are relative to this base URL.

## Authentication for Frontend

- Teamly uses JWT bearer tokens.
- Include this header on protected routes:

```http
Authorization: Bearer <token>
```

- Public routes:
  - `POST /api/auth/register`
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
  - `POST /api/auth/signin`
  - `GET /api/teams`

## Auth Endpoints (`/api/auth`)

### Register / Signup

- `POST /api/auth/register`
- `POST /api/auth/signup`

Request body:

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

Success response (`201`):

```json
{
  "token": "<jwt-token>"
}
```

### Login / Signin

- `POST /api/auth/login`
- `POST /api/auth/signin`

You can log in with either `username` or `email`.

Request body (username):

```json
{
  "username": "john_doe",
  "password": "secret123"
}
```

Request body (email):

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

Success response (`200`):

```json
{
  "token": "<jwt-token>"
}
```

### Signout

- `POST /api/auth/signout`
- Auth required: `Yes`

Success response (`200`):

```json
{
  "message": "Signed out successfully"
}
```

### Delete User

- `DELETE /api/auth/delete/{id}`
- Auth required: `Yes`
- Success response: `204 No Content`

## Teams Endpoints (`/api/teams`)

### Get all teams

- `GET /api/teams`
- Auth required: `No`

Response (`200`):

```json
[
  {
    "teamId": 1,
    "teamName": "Media Team",
    "teamDescription": "Handles livestream and recording",
    "teamCreatedDate": "2026-04-02",
    "ownerUsername": "john_doe"
  }
]
```

### Create team

- `POST /api/teams`
- Auth required: `Yes`

Request:

```json
{
  "teamName": "Ushering",
  "teamDescription": "Welcomes and seats guests"
}
```

Response (`201`): `TeamResponse`

### Update team

- `PUT /api/teams/{id}`
- Auth required: `Yes`
- Only team owner can update.

Request body: same as create team.

### Delete team

- `DELETE /api/teams/{id}`
- Auth required: `Yes`
- Only team owner can delete.
- Response: `204 No Content`

### Join team

- `POST /api/teams/{teamId}/join`
- Auth required: `Yes`

Request:

```json
{
  "position": "Volunteer"
}
```

Response (`200`):

```json
{
  "message": "Joined team successfully"
}
```

### Get team members

- `GET /api/teams/{teamId}/members`
- Auth required: `Yes`

Response (`200`):

```json
[
  {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "john_doe"
  }
]
```

## Announcements Endpoints (`/api/announcements`)

### Get announcements

- `GET /api/announcements`
- Auth required: `Yes`

### Post announcement

- `POST /api/announcements`
- Auth required: `Yes`
- Request body: `AnnouncementRequest`
- Response (`201`): `AnnouncementResponse`

### Delete announcement

- `DELETE /api/announcements/{id}`
- Auth required: `Yes`

Response (`200`):

```json
{
  "message": "Announcement deleted successfully"
}
```

## Requests Endpoints (`/api/requests`)

- `GET /api/requests` (auth required)
- `POST /api/requests` (auth required, body: `RequestCreateRequest`)
- `PATCH /api/requests/{id}/status` (auth required, body: `RequestStatusUpdateRequest`)

## Events Endpoints (`/api/events`)

- `GET /api/events` (auth required)
- `POST /api/events` (auth required, body: `EventCreateRequest`)
- `GET /api/events/{eventId}/tasks` (auth required)
- `PATCH /api/events/tasks/{taskId}` (auth required, body: `TaskStatusUpdateRequest`)

## User Endpoint (`/api/users`)

### Update profile picture

- `PUT /api/users/profile-picture`
- Auth required: `Yes`
- Content type: `multipart/form-data`
- Field: `file`

Success response (`200`):

```text
https://res.cloudinary.com/.../image/upload/...
```

## Common Frontend Notes

- Store token securely (e.g., secure storage / httpOnly cookie strategy depending on client architecture).
- If token is missing/expired, backend returns `401 Unauthorized`.
- Validation or bad payloads return `400 Bad Request`.
- For owner-only actions, unauthorized ownership checks may return `403` or a business error depending on handler configuration.