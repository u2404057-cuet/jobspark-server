# ⚡ JobSpark AI - Backend API Server

JobSpark AI Server is a robust Node.js & Express API built with TypeScript and MongoDB. It provides secure authentication, job CRUD operations, dashboard analytics, and AI integration powered by Groq's high-speed Llama-3 model.

---

## ✨ Features

- 🔐 **Authentication Engine**: Built with Better Auth & `@better-auth/mongo-adapter`, supporting Google OAuth 2.0 and Email/Password credentials.
- ⚡ **Groq LLM Integration**:
  - `/api/ai/chat`: Real-time Server-Sent Events (SSE) streaming career coaching assistant.
  - `/api/ai/generate-description`: Automatic job description generation using custom prompt templates.
  - `/api/ai/sessions`: Session history management for user chat streams.
- 💼 **Job Management APIs**: Full CRUD operations, server-side search querying, category/job-type filtering, and pagination support.
- 📊 **Dashboard Analytics**: Endpoint providing job stats and activity counters for user dashboards.
- 🛡️ **CORS & Security**: Configured with dynamic allowed origins for local development (`localhost:3000`, `localhost:5173`) and Vercel production deployments.
- ☁️ **Vercel Serverless Ready**: Optimized with lazy cached MongoDB connection handling and `@vercel/node` serverless wrapper support.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (via `mongodb` native driver)
- **Auth Engine**: Better Auth (`better-auth`, `@better-auth/mongo-adapter`)
- **AI SDK**: Groq SDK (`groq-sdk` with `llama-3.3-70b-versatile`)
- **Deployment**: Vercel Serverless Functions (`@vercel/node`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.x or higher)
- MongoDB Database URI (MongoDB Atlas cluster)
- Groq API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/u2404057-cuet/jobspark-server.git
   cd jobspark-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=8000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/jobspark?retryWrites=true&w=majority
   BETTER_AUTH_SECRET=your_32_character_secret_key
   BETTER_AUTH_URL=http://localhost:8000
   CLIENT_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GROQ_API_KEY=your_groq_api_key
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   The API will be available at [http://localhost:8000](http://localhost:8000).

5. **Build for production**:
   ```bash
   npm run build
   npm run start
   ```

---

## 📡 API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /api/auth/sign-up/email`: Register user credentials.
- `POST /api/auth/sign-in/email`: Log in user.
- `GET /api/auth/get-session`: Retrieve current active user session.
- `POST /api/auth/sign-in/social`: Initiate Google OAuth login.

### Jobs (`/api/jobs`)
- `GET /api/jobs`: Get jobs list (supports `search`, `category`, `type`, `page`, `limit`).
- `GET /api/jobs/my-jobs`: Get jobs posted by the authenticated user.
- `GET /api/jobs/:id`: Get detailed job info by ID.
- `POST /api/jobs`: Create a new job listing (Protected).
- `DELETE /api/jobs/:id`: Delete a job listing (Protected).

### AI Services (`/api/ai`)
- `POST /api/ai/chat`: Stream career coach response (SSE).
- `POST /api/ai/generate-description`: Generate structured job description.
- `GET /api/ai/sessions`: Fetch user chat sessions.

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats`: Retrieve statistics summary for the logged-in user.

---

## ☁️ Deploying to Vercel

1. Import the repository into Vercel.
2. In **Environment Variables**, add:
   - `MONGODB_URI`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL` (`https://jobspark-server.vercel.app`)
   - `CLIENT_URL` (`https://jobspark-zeta.vercel.app`)
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
   - `GROQ_API_KEY`
3. Make sure to whitelist `0.0.0.0/0` in **MongoDB Atlas Network Access**.
4. Deploy!
