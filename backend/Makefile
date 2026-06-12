include .env
export

.PHONY: dev build test migrate lint

# Run dev server with hot reload (requires: go install github.com/air-verse/air@latest)
dev:
	air

# Build binary
build:
	go build -o bin/server ./cmd/server

# Run tests
test:
	go test ./... -v -cover

# Run DB migrations (requires migrate CLI)
migrate:
	migrate -path ./migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path ./migrations -database "$(DATABASE_URL)" down

# Lint (requires: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest)
lint:
	golangci-lint run

# Tidy dependencies
tidy:
	go mod tidy

# Run the server directly
run:
	go run ./cmd/server
