# Daily Games Hub

A web application for sharing daily puzzle game scores with friends. Track your progress in Wordle, Connections, Contexto, and more!

## Features

- **Home Page**: Links to popular daily games (Wordle, Connections, Contexto, Mini Crossword, etc.)
- **Score Entry**: Paste your game results to track your performance
- **Friend Groups**: Create and join groups to compete with friends
- **Daily Leaderboard**: See who played what today and compare scores
- **Streak Tracking**: Maintain your streaks for consistent play
- **User Authentication**: Secure login and registration

## Tech Stack

- **Frontend**: React 18 with Vite
- **Backend**: Java 17 with Spring Boot 3.2
- **Database**: H2 (embedded, file-based) - can be switched to PostgreSQL for production
- **Authentication**: JWT-based

## Project Structure

```
daily-games-hub/
├── backend/                 # Spring Boot backend
│   ├── src/main/java/
│   │   └── com/dailygames/hub/
│   │       ├── config/      # Security & JWT configuration
│   │       ├── controller/  # REST API endpoints
│   │       ├── dto/         # Data transfer objects
│   │       ├── model/       # JPA entities
│   │       ├── repository/  # Data access layer
│   │       └── service/     # Business logic
│   └── pom.xml
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React Context providers
│   │   ├── pages/           # Page components
│   │   └── services/        # API service layer
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Java 17 or higher
- Node.js 18 or higher
- Maven 3.8 or higher

### Running the Backend

```bash
cd backend

# Install dependencies and run
./mvnw spring-boot:run

# Or on Windows
mvnw.cmd spring-boot:run
```

The backend will start at http://localhost:8080

You can access the H2 database console at http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:file:./data/dailygames`
- Username: `sa`
- Password: (empty)

### Running the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start at http://localhost:5173

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Games
- `GET /api/games` - List all supported games

### Scores
- `POST /api/scores` - Submit a score
- `GET /api/scores/my` - Get current user's scores
- `GET /api/scores/today` - Get today's scores
- `GET /api/scores/date/{date}` - Get scores for specific date
- `GET /api/scores/group/{groupId}` - Get group scores

### Groups
- `POST /api/groups` - Create a group
- `GET /api/groups` - Get user's groups
- `POST /api/groups/join/{inviteCode}` - Join a group
- `DELETE /api/groups/{id}/leave` - Leave a group
- `DELETE /api/groups/{id}` - Delete a group (owner only)

### Streaks
- `GET /api/streaks/my` - Get current user's streaks

## Supported Games

1. **Wordle** - Guess the 5-letter word in 6 tries
2. **Connections** - Group 16 words into 4 categories
3. **Contexto** - Guess the word using semantic similarity
4. **Mini Crossword** - Quick daily crossword puzzle
5. **Strands** - Find themed words in a letter grid
6. **Spelling Bee** - Make words from 7 letters
7. **Quordle** - Guess 4 words at once
8. **Nerdle** - Math equation guessing game

## Configuration

### Backend (application.properties)

```properties
# Change JWT secret for production
jwt.secret=YourSecretKey

# Switch to PostgreSQL for production
spring.datasource.url=jdbc:postgresql://localhost:5432/dailygames
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

### Frontend (vite.config.js)

The frontend proxies API requests to the backend. For production, update the proxy or configure CORS appropriately.

## License

MIT
