# ThinkingCode Student Platform Documentation

Welcome to the **ThinkingCode** student documentation. This guide outlines the complete set of features and functionalities available to students on the platform, from initial onboarding to advanced technical interviews.

---

## 1. Authentication & Access Control

### 1.1 Registration & Login
*   **Student Registration**: New students can create an account by providing their details (Name, Email, Password). 
*   **Login**: Returning students must authenticate to access the dashboard and coding features.
*   **Security**: All student sessions are managed via secure JWT tokens.

### 1.2 Guest Access Protection
*   **Unauthorized Redirection**: If a user tries to access a problem or any restricted page without logging in, the platform automatically redirects them to the **Login Page**.
*   **Session Persistence**: Once logged in, the user stays authenticated until they manually log out.

---

## 2. Problems Dashboard & Navigation

### 2.1 Problem Exploration
*   **Difficulty Filtering**: Students can easily filter challenges by clicking on **Easy**, **Medium**, or **Hard** tabs.
*   **Search**: A real-time search bar allows students to find specific problems by title.
*   **Favorites**: Students can mark problems as "favorites" for quick access later.

### 2.2 Progress Tracking
*   **Solved Indicators**: In the main problem table, a **Green Tick** appears next to problems that have been successfully solved.
*   **Calendar View**: A monthly calendar on the dashboard highlights the days a student has solved problems, helping maintain a daily streak.

---

## 3. The Coding Workspace

When a student selects a problem, they are presented with a professional-grade IDE environment.

### 3.1 Problem Details
*   **Title & Description**: Clear statement of the problem quest.
*   **Examples**: Input and output examples with explanations.
*   **Constraints**: Performance limits and input ranges.
*   **Test Cases**: Public test cases to verify the logic.

### 3.2 Monaco Code Editor
*   **High-Quality Editing**: The workspace uses the **Monaco Editor** (the engine behind VS Code), supporting syntax highlighting and IntelliSense.
*   **Reset Code**: A "Reset" button allows students to revert to the original boilerplate code.
*   **One-Click Copy**: Easily copy the entire solution to the clipboard with one click.

### 3.3 Execution & Output
*   **Run Code**: Students can run their code against provided test cases.
*   **Console Output**: The integrated console displays the output of the code or detailed **Error Messages** if the code fails.
*   **Strict Submission**: A student can only **Submit** their solution if all test cases pass ("Output correct").

---

## 4. Membership Plans (Free vs. Premium)

The platform offers a tiered access model:

### 4.1 Free Account
*   **Access**: Can solve public/free problems.
*   **Solutions**: "View Solution" logic is disabled for free accounts.
*   **Locked Problems**: Certain advanced or premium problems are **Locked**. To solve them, students must **Purchase a Plan**.

### 4.2 Premium Account
*   **Unlock Everything**: Access to all premium problems.
*   **Reference Solutions**: Detailed explanations and optimal code solutions are available.

---

## 5. Communication & Live Chat

### 5.1 Global Admin Notifications
*   **Navbar Popup**: When an administrator sends a global message or a direct message, it appears as a **Popup in the Navbar**.
*   **Live Chat**: Students can engage in real-time chat with admins for support or guidance.

---

## 6. Technical Interview System

The platform supports **One-to-One Face-to-Face** interviews conducted by administrators.

### 6.1 Interview Flow
1.  **Scheduling**: Admin sets up an interview session.
2.  **Meeting ID**: Admin sends the unique **Meeting ID** to the student via the live chat.
3.  **Acceptance**: The student accepts the invitation, which triggers the interview interface.

### 6.2 Interview Interface Tools
*   **Face-to-Face Video**: High-quality video stream between student and admin.
*   **Audio Controls**: Toggle voice (Mic ON/OFF).
*   **Video Controls**: Toggle camera (Camera ON/OFF).
*   **Screen Sharing**: Students can share their screen to explain their logic or architectural designs.
*   **Live Chat**: A dedicated chat sidebar within the interview room.
*   **Meeting Leave**: Ability to exit the session at any time.

---

## 7. Performance & Profile

### 7.1 Grading System
*   **Admin Review**: Administrators can view the code submitted by students for any problem.
*   **Grades**: Admins assign grades based on code quality and logic. These grades are displayed on the **Student's Profile**.

### 7.2 Persistence
*   **Saved Solutions**: If a student reopens a solved problem, their **last successfully submitted code** is automatically loaded.
*   **Revision**: Students have the flexibility to rewrite and re-submit code even after initial success.

### 7.3 Profile Page
*   **Analytics**: Shows a summary of solved problems, active streak, and grades received.
*   **Favorites List**: Quick access to starred problems.

---
