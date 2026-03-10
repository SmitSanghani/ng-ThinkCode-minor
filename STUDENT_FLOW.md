# Student Flow Documentation - ThinkingCode Platform

This documentation provides a comprehensive, step-by-step walkthrough of the student experience on the ThinkingCode platform. It covers everything from initial registration to advanced collaborative interviews.

---

## 1. Authentication & Onboarding

### 1.1 Student Registration
*   **Access**: Navigate to the `/register` page.
*   **UI Actions**:
    *   Enter **Full Name**, **Username**, **Email**, and **Password**.
    *   Click the **"Join the Future"** button.
*   **System Response**: 
    *   Frontend validates that all fields are filled and the email format is correct.
    *   Backend checks for existing usernames/emails in the data store.
    *   A new user profile is created with the role `student`.
    *   User is automatically redirected to the `/login` page with a success notification.

### 1.2 Student Login
*   **Access**: Navigate to the `/login` page.
*   **UI Actions**:
    *   Enter **Username/Email** and **Password**.
    *   Click the **"Login"** button.
*   **System Response**:
    *   Backend verifies credentials using bcrypt hashing.
    *   An **Access Token** (JWT) and **Refresh Token** are generated and stored securely in the browser.
    *   The `AuthService` updates the global user state.
    *   The student is navigated to their primary dashboard (Problems List).

---

## 2. The Problems Dashboard (`/student/problems`)

The dashboard is the central hub for learning and practice.

### 2.1 Exploring Challenges
*   **Action**: Browse the "All Problems" table.
*   **UI Elements**:
    *   **Status Indicator**: A green checkmark appears next to problems the student has already solved.
    *   **Title & Tags**: Each problem shows its title and technology tags (e.g., Array, String, Dynamic Programming).
    *   **Acceptance Rate**: Displays the percentage of successful submissions globally.
    *   **Difficulty Pill**: Color-coded badges: Green (Easy), Yellow (Medium), Red (Hard).

### 2.2 Searching & Filtering
*   **Search Bar**: Type keywords (e.g., "Two Sum") to filter the list in real-time.
*   **Difficulty Sidebar**: Click on "Easy", "Medium", or "Hard" buttons to filter problems by complexity.
*   **Favorites**: Click the **Star icon** on any problem. This adds the problem to the "Favorites" tab for quick access.

### 2.3 Progress Visualization
*   **Calendar Heatmap**: Located in the right sidebar. It tracks daily activity, highlighting dates when the student makes submissions to encourage daily practice.
*   **Pagination**: Use the footer navigation to move through large sets of problems.

---

## 3. The Coding Workspace (`/student/problems/:id`)

When a student clicks a problem, they enter a high-performance IDE environment.

### 3.1 Analyzing the Problem
*   **Description Tab**: Read the detailed problem statement, input/output formats, and constraints.
*   **Examples**: View sample inputs, outputs, and explanations to understand the logic required.
*   **Solution Tab**:
    *   **Free Plan**: Shows a "Premium Feature" lock.
    *   **Premium Plan**: Displays optimal reference solutions and complexity analysis.

### 3.2 Implementation (The Editor)
*   **Monaco Editor**: A full-featured code editor (identical to VS Code) is used for writing solutions.
*   **Language Selection**: Choose from supported languages (JavaScript, Python, C++, etc.).
*   **Toolbar Actions**:
    *   **Reset**: Reverts the editor to the initial starter code.
    *   **Copy**: Rapidly copies the current code to the clipboard.
    *   **Settings**: Adjust editor themes or font sizes.

### 3.3 Execution & Testing
*   **Run Code**:
    *   **Action**: Click the "Run" button.
    *   **Backend Process**: The code is sent to a secure sandbox, compiled, and executed against **Sample Test Cases**.
    *   **Console Output**: Displays "Accepted" or "Wrong Answer". If it fails, the console shows a line-by-line comparison of "Expected Output" vs "Your Output".
*   **Submit Code**:
    *   **Action**: Click the "Submit" button.
    *   **Backend Process**: The code is evaluated against a hidden, exhaustive suite of test cases.
    *   **System Response**:
        *   **Success**: Displays "Accepted", the number of test cases passed, and execution time. The problem is marked as solved.
        *   **Failure**: Provides error diagnostics (Runtime Error, Time Limit Exceeded, or Memory Limit Exceeded).

---

## 4. Collaborative Interviews (`/interview/:roomId`)

A real-time environment for technical assessments or pair programming.

### 4.1 Joining the Interview
*   **Action**: Access the room via a link provided by an admin or peer.
*   **Initialization**: The system connects to a **Socket.io** server and initiates a **WebRTC** handshake for media.

### 4.2 Peer-to-Peer Interaction
*   **Video/Audio**: 
    *   Toggle camera and microphone using the control bar.
    *   View your own feed and the peer's feed in a high-resolution grid.
*   **Screen Sharing**: Click the "Share Screen" icon. The system replaces your camera feed with your desktop stream, allowing you to walk through system designs or complex logic.

### 4.3 Collaborative Coding
*   **Live Sync**: Every character typed in the interview editor is broadcasted via Sockets. Both participants see updates in real-time with zero lag.
*   **Language Support**: Switch languages on the fly; the editor updates highlighting for both users.

### 4.4 Real-time Chat
*   **Messaging**: Send instant messages to the peer.
*   **Reply Mode**: Hover over a message and click "Reply" to create a threaded conversation.
*   **Reactions**: Add emojis to messages for quick non-verbal feedback.
*   **Message Management**: Students can delete their own messages, which updates for everyone in the room via the `chat-delete` socket event.

---

## 5. Account & Subscription

### 5.1 Premium Upgrade (`/student/plans`)
*   **Action**: Browse available subscription tiers.
*   **Access**: Clicking "Unlock Now" on a locked problem or solution tab redirects here.
*   **System Response**: Upon successful transaction, the user’s plan is updated in the database, immediately unlocking all reference solutions and premium challenges.

### 5.2 Student Profile (`/student/profile`)
*   **Overview**: Displays a summary of the student's coding journey.
*   **Data Points**: Total problems solved, favorite list, and account settings.

### 5.3 Logout
*   **Action**: Click "Logout" in the navbar.
*   **System Response**: Clears all local storage tokens, disconnects any active sockets, and redirects the student to the public landing page.
