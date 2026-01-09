# DeployZilla

## 1. Project Overview

**DeployZilla** is a secure, centralized CI/CD platform designed to orchestrate and monitor deployment pipelines. It provides an abstraction layer over existing CI/CD engines (specifically GitHub Actions), adding granular access control, real-time monitoring, and a unified dashboard for DevSecOps teams.

### Purpose

In modern software engineering, managing deployments often involves scattered tools, complex configuration files, and lack of visibility for non-experts. DeployZilla bridges this gap by offering a user-friendly interface to trigger, monitor, and manage deployments while enforcing security policies and tracking execution history.

### Problem Addressed

Standard CI/CD tools can be difficult to audit and secure at a granular level. Key issues addressed include:

- **Decentralized Visibility**: Aggregating logs and status from multiple microservices in one view.
- **Access Control**: preventing unauthorized users from triggering production deployments.
- **Real-time Feedback**: Providing immediate visual feedback on pipeline steps without needing to refresh provider consoles.

### Target Users

- **DevOps Engineers**: configured pipelines and monitored system health.
- **Developers**: triggering builds and debugging failed steps via centralized logs.
- **Project Managers/Viewers**: auditing deployment frequency and success rates without modification rights.

---

## 2. Global Architecture

The system follows a standard **Client-Server-Database** architecture, enhanced with real-time capabilities and containerized execution.

### High-Level Components

1.  **Client (Frontend)**: A Single Page Application (SPA) providing the dashboard, project management, and real-time logs visualization.
2.  **Server (Backend)**: An API and WebSocket server that handles authentication, pipeline orchestration, and communicates with the database.
3.  **Database**: A document-oriented database storing user profiles, project configurations, and persistent execution logs.
4.  **Execution Engine (Docker)**: A subsystem for running ephemeral tasks (cloning repositories, running analysis containers) in isolated environments.

### Data Flow

1.  **User Action**: A user triggers a deployment via the Frontend.
2.  **API Request**: The request is sent to the Backend, validated against the user's role.
3.  **Orchestration**: The Backend creates a new Pipeline record in the Database.
4.  **Execution**: The Backend delegates heavy tasks (e.g., git operations, security scans) to Docker containers.
5.  **Real-Time Feedback**: Logs and status updates are streamed from the containers to the Backend, then pushed to the Frontend via WebSockets in real-time.

---

## 3. Technologies and Tools

The following technologies were chosen to ensure type safety, scalability, and developer productivity.

### Backend

- **Runtime**: [Node.js](https://nodejs.org/) - Chosen for its non-blocking I/O, ideal for handling concurrent pipeline events.
- **Framework**: [Express.js](https://expressjs.com/) - A robust standard for building RESTful APIs.
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Enforces type safety and reduces runtime errors across the stack.
- **Real-time**: [Socket.io](https://socket.io/) - Enables bi-directional communication for live log streaming.
- **Container Control**: [dockerode](https://github.com/apocas/dockerode) (or similar libraries implied) - Programmatic control of the Docker daemon.

### Frontend

- **Framework**: [React 19](https://react.dev/) - Modern component-based UI library.
- **Build Tool**: [Vite](https://vitejs.dev/) - fast development server and optimized production builds.
- **Styling**: [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS for rapid and consistent UI design.
- **Component Library**: [Radix UI](https://www.radix-ui.com/) - Accessible, unstyled primitives for building robust interactive components.

### Database

- **System**: [MongoDB](https://www.mongodb.com/) - A NoSQL database chosen for its flexibility in storing semi-structured log data and flexible project configurations.
- **ODM**: [Mongoose](https://mongoosejs.com/) - Provides schema validation and relationship management (Users -> Projects -> Pipelines).

### Testing & Quality

- **Unit/Integration Testing**: [Vitest](https://vitest.dev/) - A fast test runner compatible with Vite.
- **Code Quality**: [SonarQube](https://www.sonarqube.org/) - Integrated into the pipeline for static code analysis.

---

## 4. Features

### Core Functionalities

- **Authentication & RBAC**: Secure login via OAuth2 (Google) and internal role management (Admin, Developer, Viewer).
- **Project Management**: Create, edit, and Configure repositories to be deployed.
- **Pipeline Orchestration**: Trigger start/stop/restart of deployment pipelines.
- **Live Monitoring**: Watch build steps and console output as they happen via WebSockets.
- **Deployment History**: Comprehensive audit logs of who deployed what and when.
- **Environment Management**: Securely manage environment variables for projects.

### Integrated Quality Gates

The platform integrates automatic quality checks. A pipeline can be configured to halt if it fails specific gates:

- **Linting**: Ensures coding standards.
- **Security Scans**: Checks dependencies for known vulnerabilities.

---

## 5. Code Organization

The project is structured as a monorepo containing both client and server applications.

### Folder Structure

```
Deployzilla/
├── client/                 # React Frontend Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-based page views (Dashboard, Project Details)
│   │   ├── services/       # API integration modules
│   │   └── hooks/          # Custom React hooks
│   └── package.json
│
├── server/                 # Node.js Backend Application
│   ├── src/
│   │   ├── controllers/    # Request handlers for API routes
│   │   ├── models/         # Mongoose database schemas
│   │   ├── routes/         # API endpoint definitions
│   │   ├── sockets/        # WebSocket event handlers
│   │   └── utils/          # Helper functions and business logic
│   └── package.json
```

### Key Modules

- **`server/src/controllers/pipelineController.ts`**: Handles the logic for initiating and managing pipeline lifecycles.
- **`client/src/contexts/AuthContext.tsx`**: Manages user session state across the application.

---

## 6. Setup and Execution

### Prerequisites

- **Docker** & **Docker Compose** installed on the host machine.
- **Node.js (v20+)** and **pnpm** (recommended) or npm.
- **MongoDB instance** (provided via Docker Compose).

### Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/your-repo/deployzilla.git
    cd deployzilla
    ```

2.  **Environment Configuration**:
    Duplicate `.env.example` to `.env` in both `client/` and `server/` directories and populate necessary values (Database URI, Google OAuth credentials).

### Running Locally

The easiest way to start the full stack is using the provided Docker Compose configuration.

```bash
# Start backend, database, and necessary services
docker compose up -d

# Install dependencies and start frontend (if running outside docker)
cd client
npm install
npm run dev
```

Access the application at `http://localhost:5173` (or configured port).

---

## 7. Security, Performance, and Reliability

### Security

- **Input Validation**: All API inputs are validated using **Zod** schemas to prevent injection attacks and ensure data integrity.
- **Authentication**: Uses secure HTTP-only cookies and JWTs for session management.
- **Secret Management**: Environment variables for projects can be stored securely, preventing leakage in logs.

### Performance

- **WebSockets**: Used instead of HTTP polling for log updates, reducing server load and network traffic.
- **Optimized Builds**: The frontend uses Vite for tree-shaking and efficient asset bundling.

### Reliability

- **Global Error Handling**: Express middleware captures and logs unhandled exceptions to prevent server crashes.
- **Docker Isolation**: Pipeline steps run in isolated containers, ensuring that a critical failure in a build tool does not bring down the main orchestrator.

---

## 8. Limitations and Possible Improvements

While functional, the current system has known limitations that provide avenues for future academic or industrial development.

### Limitations

- **Single Node Execution**: Currently, the server and execution engine run on the same node. Heavy load could impact API responsiveness.
- **Limited Provider Support**: Primary support is for generic git/Docker workflows; deep integration with specific cloud providers (AWS, Azure) is manual.

### Future Improvements

1.  **Distributed Runners**: Decouple the execution engine to run on remote worker nodes (similar to GitLab Runners).
2.  **Plugin Architecture**: Allow third-party extensions to add new pipeline step types without modifying core code.
3.  **Advanced Analytics**: Add DORA metrics (Deployment Frequency, Lead Time for Changes) visualization.
