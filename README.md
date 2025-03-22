# Country Box

## 🛠️ Tech Stack
- **Go** (Backend)
- **Nuxt** (Frontend)
- **Goose** (Database Migration)
- **MySQL** (Database)

## 📦 Installation
1. Clone the repository:
```bash
git clone https://gitea.jospace.de/Freddy/country-box
cd country-box
```

2. Install backend dependencies:
```bash
go mod tidy
```

3. Install frontend dependencies:
```bash
cd frontend
pnpm install
```

4. Configure enviroment variables:
Create a `.env file` based on `.env.example` and set database credentials for the backend.  
Create a `frontend/.env` file based on `frontend/.env.example` for frontend-specific configurations.

5. Install Goose:
```bash
go install github.com/pressly/goose/v3/cmd/goose@latest
```

## 🏗️ Database Migrations
1. Create a new migration:
```bash
goose create add_users_table sql
```
This generates an up/down migration file in the migrations/ folder.

2. Run migrations:
```bash
goose up
```

3. Rollback migrations:
```bash
goose down
```

## 🚀 Running the Project

Run Backend Locally:
```bash
go run cmd/api/main.go
```

Run Frontend Locally:
```bash
cd frontend
pnpm dev
```

## 📜 Deployment
Deploy using Systemd:
1. Copy the `scripts/systemd/countryBox.server` file to `/etc/systemd/system`
2. Start the servíce:
```bash
sudo systemctl start countryBox
sudo systemctl enable countryBox
```

## 📜 License
MIT License. See `LICENSE` for details.

<!-- ## MakeFile
Run build make command with tests
```bash
make all
```

Build the application
```bash
make build
```

Run the application
```bash
make run
```
Create DB container
```bash
make docker-run
```

Shutdown DB Container
```bash
make docker-down
```

DB Integrations Test:
```bash
make itest
```

Live reload the application:
```bash
make watch
```

Run the test suite:
```bash
make test
```

Clean up binary from the last build:
```bash
make clean
``` -->
