# Kairon AI - AI-Powered Learning Platform

Kairon AI is a comprehensive learning assistant designed to help users master study material through advanced AI-powered tools. Ingest your content and leverage features like automated summarization, spaced repetition flashcards, semantic search, and an interactive AI tutor.

This project is built with a modern full-stack architecture using React, TypeScript, Node.js, Express, and MongoDB, and is fully integrated with the Google Gemini API.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, D3.js
- **Backend:** Node.js, Express, TypeScript (Source in `/server/src`)
- **Database:** MongoDB (with Mongoose)
- **Authentication:** JWT-based Authentication
- **AI:** Google Gemini API (`@google/genai`)

## Project Setup

To run this project locally, you need to configure both the frontend and the backend with the necessary environment variables.

### 1. Backend Configuration (`/server/.env`)

The backend server handles secure operations, database interaction, and all calls to the Gemini API.

- **How to set up:**
  1. Navigate to the `/server` directory.
  2. Rename the `.env.example` file to `.env`.
  3. Fill in the required values as described below.

- **Required Variables:**
  - `PORT`: The port for the server to run on (e.g., 5001).
  - `MONGO_URI`: Your MongoDB connection string (from MongoDB Atlas).
  - `JWT_SECRET`: A long, random, secret string used to sign authentication tokens.
  - `API_KEY`: Your **Google Gemini API Key**. You can get this from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 2. Frontend Configuration (`/.env`)

The frontend application needs to know where to send its API requests.

- **How to set up:**
  1. In the **root project directory**, rename the `.env.example` file to `.env`.
  2. Fill in the required values.

- **Required Variables:**
  - `VITE_API_BASE_URL`: The full URL of your running backend server (e.g., `http://localhost:5001`).

## Running the Application Locally

1.  **Install Backend Dependencies:**
    ```bash
    cd server
    npm install
    ```
2.  **Install Frontend Dependencies:**
    ```bash
    # From the root directory
    npm install
    ```
3.  **Run the Backend Server:**
    ```bash
    # From the /server directory
    npm run dev
    ```
4.  **Run the Frontend Dev Server:**
    ```bash
    # From the root directory
    npm run dev
    ```
The application should now be running, with the frontend communicating with your local backend server.

## Key Features

- **Ingest Engine:** Upload `.txt` files or paste text directly to create a new study project.
- **AI Summary:** Automatically generate a concise summary of your ingested material.
- **Flashcards:** Create smart flashcards with a Spaced Repetition System (SRS) to optimize learning and retention.
- **MCQ Generator:** Test your knowledge with multiple-choice quizzes generated from your content.
- **Semantic Search:** Go beyond keywords and search your notes based on meaning and context.
- **AI Tutor:** Engage in a contextual conversation with an AI that can answer questions about your study material.
- **Audio/Video Analysis:** Upload media files to transcribe the content and then analyze it with other AI tools.
- **Concept Map:** Visualize the key concepts and their relationships in a dynamic, interactive graph.
- **Lesson & Study Planners:** For educators and students, automatically generate structured plans based on the ingested content.
- **Secure Authentication:** Full user authentication system with JWT, password hashing, and user profiles.