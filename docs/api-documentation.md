# KCC Event Management System API Documentation

This document provides detailed information about the KCC Event Management System API endpoints, authentication, and usage.

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Authentication Endpoints](#authentication-endpoints)
   - [User Management](#user-management)
   - [Event Management](#event-management)
   - [Attendee Management](#attendee-management)
   - [Entrance Management](#entrance-management)
4. [Error Handling](#error-handling)
5. [Examples](#examples)

## Introduction

The KCC Event Management System API provides functionality for managing events, attendees, check-ins, and entrances at the Kigali Convention Center. It enables event organizers to create and manage events, register attendees, track check-ins, and generate statistics.

**Base URL**: `http://localhost:3000` (development environment)

## Authentication

The API uses JWT (JSON Web Token) for authentication. To access protected endpoints, you need to include the JWT token in the Authorization header of your requests.

### Token Format

```
Authorization: Bearer <your_jwt_token>
```

### User Roles

- **user**: Default role with limited permissions
- **admin**: Administrative role with full access

## API Endpoints

### Authentication Endpoints

#### Register a New User

```
POST /auth/register
```

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response**:

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "createdAt": "2025-04-28T10:00:15.228Z",
  "updatedAt": "2025-04-28T10:00:15.228Z"
}
```

#### User Login

```
POST /auth/login
```

**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response**:

```json
{
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get User Profile

```
GET /auth/profile
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Response**:

```json
{
  "userId": 1,
  "email": "john@example.com",
  "role": "user"
}
```

### User Management

> ⚠️ **Note**: These endpoints require admin privileges.

#### Get All Users

```
GET /users
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

#### Get User by ID

```
GET /users/:id
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

#### Create a User

```
POST /users
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Request Body**:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword",
  "role": "user"
}
```

#### Update a User

```
PUT /users/:id
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Request Body**:

```json
{
  "name": "Jane Smith",
  "role": "admin"
}
```

#### Delete a User

```
DELETE /users/:id
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

### Event Management

#### Get All Events

```
GET /events
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

#### Get Event by ID

```
GET /events/:id
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

#### Create an Event

> ⚠️ **Note**: This endpoint requires admin privileges.

```
POST /events
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Request Body**:

```json
{
  "name": "KCC Annual Conference 2025",
  "description": "Annual tech conference for developers",
  "location": "Kigali Convention Center",
  "startDate": "2025-06-15",
  "endDate": "2025-06-17",
  "attendeeLimit": 500
}
```

#### Update an Event

> ⚠️ **Note**: This endpoint requires admin privileges.

```
PUT /events/:id
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Request Body**:

```json
{
  "name": "KCC Annual Developer Conference 2025",
  "attendeeLimit": 600
}
```

#### Delete an Event

> ⚠️ **Note**: This endpoint requires admin privileges.

```
DELETE /events/:id
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

### Attendee Management

#### Get All Attendees

```
GET /attendees
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters**:

- `eventId`: (optional) Filter attendees by event ID

#### Get Attendees by Event ID

```
GET /attendees?eventId=1
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

#### Get Attendee by ID

```
GET /attendees/:id
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

#### Get Attendee by Badge ID

```
GET /attendees/badge/:badgeId
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

#### Register an Attendee

```
POST /attendees/register
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Request Body**:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "123-456-7890",
  "organization": "Tech Corp",
  "eventId": 1
}
```

**Response**:

```json
{
  "id": 1,
  "badgeId": "B74552",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "123-456-7890",
  "organization": "Tech Corp",
  "eventId": 1,
  "checkedIn": false,
  "checkInTime": null,
  "entrance": null,
  "createdAt": "2025-04-28T09:45:15.870Z",
  "updatedAt": "2025-04-28T09:45:15.870Z"
}
```

#### Check-in an Attendee

```
POST /attendees/check-in
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Request Body**:

```json
{
  "badgeId": "B74552",
  "entrance": "Main Entrance",
  "eventId": 1
}
```

**Response**:

```json
{
  "id": 1,
  "badgeId": "B74552",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "123-456-7890",
  "organization": "Tech Corp",
  "eventId": 1,
  "checkedIn": true,
  "checkInTime": "2025-04-28T09:46:17.303Z",
  "entrance": "Main Entrance",
  "createdAt": "2025-04-28T09:45:15.870Z",
  "updatedAt": "2025-04-28T09:46:17.000Z"
}
```

#### Get Event Attendance Statistics

```
GET /attendees/event/:eventId/stats
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Response**:

```json
{
  "totalRegistered": 100,
  "totalCheckedIn": 75,
  "checkInRate": 75.0
}
```

#### Get Recent Check-ins

```
GET /attendees/event/:eventId/recent-check-ins
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters**:

- `limit`: (optional) Maximum number of check-ins to return (default: 10)

#### Delete an Attendee

> ⚠️ **Note**: This endpoint requires admin privileges.

```
DELETE /attendees/:id
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

### Entrance Management

#### Get All Entrances

```
GET /entrances
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters**:

- `eventId`: (optional) Filter entrances by event ID

#### Get Entrance by ID

```
GET /entrances/:id
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

#### Create an Entrance

> ⚠️ **Note**: This endpoint requires admin privileges.

```
POST /entrances
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Request Body**:

```json
{
  "name": "Main Entrance",
  "description": "Front entrance of the convention center",
  "eventId": 1
}
```

#### Update an Entrance

> ⚠️ **Note**: This endpoint requires admin privileges.

```
PUT /entrances/:id
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Request Body**:

```json
{
  "name": "Main Hall Entrance",
  "description": "Updated description"
}
```

#### Delete an Entrance

> ⚠️ **Note**: This endpoint requires admin privileges.

```
DELETE /entrances/:id
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

#### Get Entrance Statistics

```
GET /entrances/event/:eventId/stats
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Response**:

```json
{
  "entrances": [
    {
      "name": "Main Entrance",
      "count": 45,
      "percentage": 60.0
    },
    {
      "name": "Side Entrance",
      "count": 30,
      "percentage": 40.0
    }
  ],
  "totalCheckedIn": 75
}
```

#### Increment Scan Count

```
POST /entrances/:id/increment-scan
```

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

The API returns standard HTTP status codes to indicate the success or failure of a request:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., email already registered)
- `500 Internal Server Error`: Server error

Error responses include a message explaining the error:

```json
{
  "statusCode": 400,
  "message": "Email is already registered for this event",
  "error": "Bad Request"
}
```

## Examples

### Register a New User and Login

1. Register a new user:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"securepassword"}'
```

2. Login to get a JWT token:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"securepassword"}'
```

3. Use the token to access a protected endpoint:

```bash
curl -X GET http://localhost:3000/events \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Create an Event and Register an Attendee

1. Create an event (admin only):

```bash
curl -X POST http://localhost:3000/events \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "KCC Annual Conference 2025",
    "description": "Annual tech conference for developers",
    "location": "Kigali Convention Center",
    "startDate": "2025-06-15",
    "endDate": "2025-06-17",
    "attendeeLimit": 500
  }'
```

2. Register an attendee:

```bash
curl -X POST http://localhost:3000/attendees/register \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "123-456-7890",
    "organization": "Tech Corp",
    "eventId": 1
  }'
```

3. Check-in an attendee:

```bash
curl -X POST http://localhost:3000/attendees/check-in \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "badgeId": "B74552",
    "entrance": "Main Entrance",
    "eventId": 1
  }'
```
