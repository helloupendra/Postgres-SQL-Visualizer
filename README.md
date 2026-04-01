<div align="center">
  <h1>🐘 Postgres SQL Visualizer</h1>
  <p>A modern, interactive SQL editor and database schema visualizer built with React, Vite, and Express.</p>
</div>

<br />

## 🚀 Overview

**Postgres SQL Visualizer** is a tool designed to make interacting with your PostgreSQL database seamless and visually intuitive. It connects directly to your database through an Express backend and provides a stunning, high-performance UI to run your queries, view results, and visualize your database's schema architectures dynamically.

### ✨ Key Features

- **SQL Editor**: Full-featured code editor with syntax highlighting using CodeMirror.
- **Dynamic Schema Visualizer**: Automatically maps your tables, columns, primary keys, and foreign-key relationships using React Flow.
- **Execution & Explain Mode**: Execute SQL safely and view formatting execution plans seamlessly.
- **Split-Pane Layout**: Resize your terminal panels on the fly using `react-resizable-panels`.
- **Dark Mode UI**: Beautifully designed dark interface utilizing Tailwind CSS, Radix UI, and Lucide icons.
- **Concurrent Server Flow**: A single Vite build running concurrently with an Express proxy to eliminate CORS limits!

<br />

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, TypeScript
- **UI Architecture**: UIW CodeMirror, React Flow (`@xyflow/react`), Radix UI Primitives 
- **Backend Bridge**: Express.js, `pg` (node-postgres), `tsx`

---

## 💻 Running Locally

### 1. Prerequisites
- Node.js (v18+ recommended)
- A running PostgreSQL instance (Local, Docker, Neon, Supabase, etc.)

### 2. Installation
Clone the repository, navigate into the project directory, and install the dependencies:
```bash
npm install
```

### 3. Setup Environment Variables
Create a local `.env` file containing your Postgres connection strings:

```env
# Create a `.env` in the root folder with this format:
DATABASE_URL="postgres://username:password@localhost:5432/my_database"
```

### 4. Start the Application
Boot up the concurrent development servers (React + Express API):

```bash
npm run dev
```

The app will become available at `http://localhost:3000`.

---

## 🔒 Security Note
This visualizer grants direct programmatic access to execute **raw SQL commands** against the configured database. When running it locally, be mindful that commands like `DROP` and `DELETE` will alter your live schema! For public-facing deployments, read-only PostgreSQL service roles should be enforced.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page and open a PR.

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).
