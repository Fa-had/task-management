package database

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Connect creates a PostgreSQL connection pool.
func Connect(databaseURL string) (*pgxpool.Pool, error) {
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	config.MaxConns = 25
	config.MinConns = 5

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Ping to verify connection
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return pool, nil
}

// RunMigrations applies all pending SQL migrations.
// Uses golang-migrate under the hood.
// Run: migrate -path ./migrations -database $DATABASE_URL up
// Or call this programmatically using the migrate library.
func RunMigrations(databaseURL string) error {
	// TODO: integrate golang-migrate programmatically if preferred
	// For now, migrations are run via `make migrate` CLI command.
	// This function is a placeholder for programmatic migration support.
	return nil
}
