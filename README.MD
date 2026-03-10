# TaskIt

TaskIt is a full-stack task management web application built with **Node.js**, **Express**, **MongoDB**, and **EJS**.
It allows users to register, log in, and manage their personal tasks with full CRUD functionality.

The application includes authentication, secure password hashing, access control, and security middleware to protect the application.

---

## Features

* User registration and login
* Secure password hashing using bcrypt
* Session-based authentication for the web interface
* JWT authentication for API endpoints
* Create, view, update, and delete tasks
* Search tasks
* Pagination and sorting
* Flash notifications for user feedback
* Access control to prevent users from accessing other users' tasks
* Global error handling middleware
* Security protections including helmet and rate limiting
* Server-side rendered views using EJS

---

## Technologies Used

Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

Frontend

* EJS
* Express EJS Layouts
* CSS (static files in public folder)

Security

* bcryptjs
* helmet
* express-rate-limit
* express-session
* express-flash
* cors

---

## Project Structure

```
taskit
│
├── controllers
│   ├── authController.js
│   └── taskController.js
│
├── middleware
│   └── authMiddleware.js
│
├── models
│   ├── User.js
│   └── Task.js
│
├── routes
│   ├── authRoutes.js
│   └── taskRoutes.js
│
├── views
│   ├── layout.ejs
│   ├── index.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── dashboard.ejs
│   ├── createTask.ejs
│   └── editTask.ejs
│
├── public
│   └── styles.css
│
├── app.js
├── .env
└── package.json
```

---

## Installation

Clone the repository

```
git clone https://github.com/xpwetx/taskit.git
cd taskit
```

Install dependencies

```
npm install
```

Create a `.env` file in the root directory

```
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
```

Start the application

```
npm start
```

The application will run at:

```
http://localhost:3000
```

---

## API Endpoints

Authentication

```
POST /api/auth/register
POST /api/auth/login
```

Tasks

```
GET /api/tasks
GET /api/tasks/:id
POST /api/tasks
PUT /api/tasks/:id
DELETE /api/tasks/:id
```

Optional query parameters for tasks

```
?page=1
&limit=10
&search=keyword
&sort=createdAt
```

---

## Security Features

* Passwords hashed using bcrypt
* Rate limiting to prevent brute force attacks
* Helmet for secure HTTP headers
* Access control to ensure users can only access their own tasks
* Global error handling middleware
* Session protection for authenticated routes

---

## Deployment

The application can be deployed to platforms such as:

* Render
* Railway
* Heroku

Make sure environment variables are configured in the deployment environment.

---

## Author

Created by Xavier

---

## License

This project is for educational purposes.
