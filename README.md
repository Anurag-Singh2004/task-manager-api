# Task Manager API 🚀

A production-ready REST API built with Node.js, Express, MongoDB and JWT Authentication.

## 🌐 Live URL
```
https://task-manager-api-7bwf.onrender.com
```

## 🛠️ Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (Access + Refresh Tokens)
- **Validation**: express-validator
- **Password Hashing**: bcryptjs
- **Deployment**: Render

---

## 🚀 Getting Started (Local Setup)

### 1. Clone the repository
```bash
git clone https://github.com/Anurag-Singh2004/task-manager-api.git
cd task-manager-api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
JWT_EXPIRE=1d
REFRESH_EXPIRE=30d
NODE_ENV=development
```

### 4. Run the server
```bash
npm run dev
```

Server runs at `http://localhost:3000` 🚀

---

## 🔐 Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

### How it works:
1. Register or Login to get `accessToken` and `refreshToken`
2. Use `accessToken` for all protected requests
3. When `accessToken` expires → use `refreshToken` to get a new one
4. On logout → `refreshToken` is invalidated

---

## 📋 API Endpoints

### 🔑 Auth Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new account | ❌ |
| POST | `/auth/login` | Login and get tokens | ❌ |
| POST | `/auth/refresh` | Get new access token | ❌ |
| POST | `/auth/logout` | Logout and invalidate token | ✅ |

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@gmail.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@gmail.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGci..."
}
```

#### Logout
```http
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGci..."
}
```

---

### 📁 Project Routes

| Method | Endpoint | Description | Who Can? |
|--------|----------|-------------|----------|
| GET | `/projects` | Get all your projects | Logged in user |
| POST | `/projects` | Create new project | Logged in user |
| GET | `/projects/:id` | Get single project | Owner or Member |
| PUT | `/projects/:id` | Update project | Owner only |
| DELETE | `/projects/:id` | Delete project | Owner only |
| POST | `/projects/:id/members` | Add member | Owner only |
| DELETE | `/projects/:id/members/:userId` | Remove member | Owner only |

#### Create Project
```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Awesome Project",
  "description": "Project description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64abc123...",
    "title": "My Awesome Project",
    "description": "Project description",
    "owner": "64abc456...",
    "members": [],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Add Member
```http
POST /projects/:id/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "64abc789..."
}
```

---

### ✅ Task Routes

| Method | Endpoint | Description | Who Can? |
|--------|----------|-------------|----------|
| GET | `/projects/:id/tasks` | Get all tasks | Owner or Member |
| POST | `/projects/:id/tasks` | Create task | Owner or Member |
| GET | `/projects/:id/tasks/:taskId` | Get single task | Owner or Member |
| PUT | `/projects/:id/tasks/:taskId` | Update task | Owner or Assignee |
| PATCH | `/projects/:id/tasks/:taskId/status` | Update status only | Owner or Assignee |
| DELETE | `/projects/:id/tasks/:taskId` | Delete task | Owner only |

#### Create Task
```http
POST /projects/:id/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Design Homepage",
  "description": "Create wireframes for homepage",
  "status": "todo",
  "priority": "high",
  "dueDate": "2024-12-31",
  "assignedTo": "64abc789...",
  "category": "64abc012..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64abc999...",
    "title": "Design Homepage",
    "description": "Create wireframes for homepage",
    "status": "todo",
    "priority": "high",
    "dueDate": "2024-12-31T00:00:00.000Z",
    "assignedTo": {
      "_id": "64abc789...",
      "name": "John Doe",
      "email": "john@gmail.com"
    },
    "project": "64abc123...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update Task Status
```http
PATCH /projects/:id/tasks/:taskId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in-progress"
}
```

**Valid status values:** `todo` | `in-progress` | `done`

---

### 🏷️ Category Routes

| Method | Endpoint | Description | Who Can? |
|--------|----------|-------------|----------|
| GET | `/projects/:id/categories` | Get all categories | Owner or Member |
| POST | `/projects/:id/categories` | Create category | Owner only |
| DELETE | `/projects/:id/categories/:categoryId` | Delete category | Owner only |

#### Create Category
```http
POST /projects/:id/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Design",
  "color": "#FF5733"
}
```

---

## 📊 Data Models

### User
```json
{
  "name": "string (required, min 2 chars)",
  "email": "string (required, unique)",
  "password": "string (required, min 6 chars, hashed)",
  "role": "user | admin (default: user)",
  "createdAt": "date"
}
```

### Project
```json
{
  "title": "string (required, min 2 chars)",
  "description": "string (optional)",
  "owner": "ObjectId → User",
  "members": "[ObjectId → User]",
  "createdAt": "date"
}
```

### Task
```json
{
  "title": "string (required, min 2 chars)",
  "description": "string (optional)",
  "status": "todo | in-progress | done (default: todo)",
  "priority": "low | medium | high (default: medium)",
  "dueDate": "date (optional)",
  "assignedTo": "ObjectId → User (optional)",
  "category": "ObjectId → Category (optional)",
  "project": "ObjectId → Project (required)",
  "createdAt": "date"
}
```

### Category
```json
{
  "name": "string (required, min 2 chars)",
  "color": "string (default: #4A90D9)",
  "project": "ObjectId → Project (required)"
}
```

---

## ⚠️ Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK — Request succeeded |
| 201 | Created — Resource created |
| 400 | Bad Request — Invalid data |
| 401 | Unauthorized — Not logged in |
| 403 | Forbidden — No permission |
| 404 | Not Found — Resource doesn't exist |
| 500 | Server Error — Something went wrong |

---

## 🔒 Authorization Rules

| Action | Public | User | Member | Owner | Admin |
|--------|--------|------|--------|-------|-------|
| Register/Login | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Project | ❌ | ✅ | ✅ | ✅ | ✅ |
| View Project | ❌ | ❌ | ✅ | ✅ | ✅ |
| Update/Delete Project | ❌ | ❌ | ❌ | ✅ | ✅ |
| Create/View Tasks | ❌ | ❌ | ✅ | ✅ | ✅ |
| Update Task | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete Task | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage Categories | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 📁 Project Structure

```
task-manager-api/
├── middleware/
│   ├── auth.js          ← JWT verification (protect)
│   └── validate.js      ← Input validation checker
├── models/
│   ├── User.js          ← User schema + password hashing
│   ├── Project.js       ← Project schema
│   ├── Task.js          ← Task schema
│   └── Category.js      ← Category schema
├── routes/
│   ├── auth.js          ← /register /login /refresh /logout
│   ├── projects.js      ← Project CRUD
│   ├── tasks.js         ← Task CRUD
│   └── categories.js    ← Category CRUD
├── .env.example         ← Environment variables template
├── .gitignore
├── app.js               ← Server entry point
└── package.json
```

---

## 👨‍💻 Author

**Anurag Singh**
- GitHub: [@Anurag-Singh2004](https://github.com/Anurag-Singh2004)

---

*Built with ❤️ using Node.js and Express*
