# MEAN Stack Application (Angular + Node.js)

## 1.2 Project Overview
This project is an **Online JavaScript Practice Platform** that allows students to practice JavaScript coding problems in a LeetCode-style environment.

The system has two main panels:
1.  **Admin Panel** – Used to manage coding questions and monitor student submissions.
2.  **Student Panel** – Used by students to practice problems, run code, get AI-based error explanations, and submit solutions.

---

A production-ready full-stack application built with Angular (Frontend) and Node.js/Express (Backend).

## Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Angular CLI](https://angular.io/cli) (v17+)
- [MongoDB](https://www.mongodb.com/) (Must be running locally or have a connection string)

## Architecture
- **Frontend**: Angular 17+ (Standalone), Lazy Loading, Interceptors, Guards, Services.
- **Backend**: Node.js, Express, MVC Pattern, JWT Authentication, Mongoose.

## Getting Started

### 1. Backend Setup
The backend handles API requests and database connections.

1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment:
    - A `.env` file has been created for you with default values.
    - Update `DATABASE_URL` in `.env` if your MongoDB is not at `mongodb://localhost:27017/ng_fullstack_db`.
    - `JWT_SECRET` should be changed for production.
4.  Run the server:
    ```bash
    npm run dev
    ```
    - Server will start on `http://localhost:5000`.

### 2. Frontend Setup
The frontend is the user interface.

1.  Navigate to the frontend folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the application:
    ```bash
    ng serve
    ```
4.  Open your browser at [http://localhost:4200](http://localhost:4200).

## Features
- **Authentication**: Register and Login with JWT support.
- **Dashboard**: Protected route, only accessible after login.
- **Security**: HttpInterceptor attaches tokens to requests automatically.

## Common Issues & Fixes
- **MongoDB Connection Error**: Ensure MongoDB is running. Check `DATABASE_URL` in `backend/.env`.
- **CORS Error**: The backend is configured to allow CORS, but ensure `frontend/src/environments/environment.ts` points to the correct backend URL.
- **Module Not Found**: Run `npm install` in both `backend` and `frontend` directories.
