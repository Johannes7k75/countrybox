# Simple Makefile for a Go project

# Build the application
all: build test

build:
	@echo "Building..."
	
	
	@go build -o tmp/main.exe cmd/api/main.go

# Run the application
run:
ifeq ($(OS),Windows_NT)
	@powershell -ExecutionPolicy Bypass -Command "& {wt -d . split-pane -H -p 'Windows PowerShell' -- go run cmd/api/main.go ; split-pane -p 'Windows PowerShell' -- pnpm install --prefer-offline --prefix ./frontend ; pnpm --prefix ./frontend dev }"
else
	@tmux new-session \; \
		split-window -h \; \
		send-keys 'go run cmd/api/main.go' C-m \; \
		select-pane -t 1 \; \
		send-keys 'pnpm install --prefer-offline --prefix ./frontend && pnpm --prefix ./frontend dev' C-m \; \
		attach
endif



# Create DB container
docker-run:
	@docker compose up --build

# Shutdown DB container
docker-down:
	@docker compose down

# Test the application
test:
	@echo "Testing..."
	@go test ./... -v
# Integrations Tests for the application
itest:
	@echo "Running integration tests..."
	@go test ./internal/database -v

# Clean the binary
clean:
	@echo "Cleaning..."
	@rm -f main

# Live Reload
watch:
	@powershell -ExecutionPolicy Bypass -Command "if (Get-Command air -ErrorAction SilentlyContinue) { \
		air; \
		Write-Output 'Watching...'; \
	} else { \
		Write-Output 'Installing air...'; \
		go install github.com/air-verse/air@latest; \
		air; \
		Write-Output 'Watching...'; \
	}"

.PHONY: all build run test clean watch docker-run docker-down itest
