# Study Sanctuary - Backend

The core REST API and WebSocket server powering the **AIT Study Sanctuary**. 

Built with Node.js and Express, this application manages user authentication, study session CRUD operations, academic analytics, and an integrated session matching algorithm backed by a relational database using Sequelize.

## 🚀 Tech Stack

- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Database ORM:** Sequelize
- **Database:** MySQL
- **Real-Time Protocol:** Socket.IO
- **Security:** JSON Web Tokens (JWT), bcryptjs
- **Environment Management:** dotenv

## ✨ Core Features

- **Authentication System:** Secure JWT-based auth flows with password hashing (`/api/auth`).
- **Session matching:** A custom weighting algorithm that scores study groups based on exact course queries, time availability, skill level, and location (`/api/matches`).
- **Real-Time Collaboration:** Socket.IO integration to broadcast live chat messages to users within connected study session namespaces (`/api/sessions/:id/join`).
- **Analytics Controller:** Consolidates study log hours for personalized frontend velocity tracking (`/api/logs`).

## 📦 Prerequisites

Ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/)
- [MySQL Server](https://dev.mysql.com/downloads/) (Running locally or via a cloud provider)

## 🛠️ Installation & Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root of the `backend` directory referencing your MySQL database details:
   ```env
   PORT=5002
   DB_NAME=study_sanctuary
   DB_USER=root
   DB_PASS=your_mysql_password
   DB_HOST=localhost
   JWT_SECRET=your_super_secret_jwt_key
   ```

4. **Start the Server:**
   ```bash
   npm start
   ```
   *(Ensure your MySQL daemon is active so Sequelize can successfully synchronize the models). 
   The server will run at `http://localhost:5002`.*

## 📜 Available Scripts

- `npm start` - Starts the Express application using `node`.
- *Note: You can install `nodemon` locally for auto-restarts during development: `npm install -D nodemon` and run `npx nodemon server.js`*.

## 📁 Project Structure

```text
backend/
├── config/               # Database connection logic (db.js)
├── controllers/          # Request/response controllers (auth, match, log, user, session)
├── middlewares/          # Custom Express middleware (auth protection)
├── models/               # Sequelize Schema definitions (User, StudySession, StudyLog)
├── routes/               # Express API routing definitions
├── .env                  # Environment Variables
├── server.js             # Main server entrypoint & socket configuration
└── package.json          # Project dependencies & scripts
```
