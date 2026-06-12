package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/Fa-had/task_management/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// UserRepository handles all user-related database operations.
type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
	`
	_, err := r.db.Exec(ctx, query,
		user.ID, user.Email, user.Name, user.PasswordHash, user.Role,
	)
	if err != nil {
		// Check for unique constraint violation (email already exists)
		if isUniqueViolation(err) {
			return errors.New("email already registered")
		}
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, email, name, password_hash, role, created_at, updated_at
		FROM users
		WHERE email = $1
	`
	row := r.db.QueryRow(ctx, query, email)
	user := &models.User{}
	err := row.Scan(
		&user.ID, &user.Email, &user.Name,
		&user.PasswordHash, &user.Role,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	return user, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (*models.User, error) {
	query := `
		SELECT id, email, name, password_hash, role, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	row := r.db.QueryRow(ctx, query, id)
	user := &models.User{}
	err := row.Scan(
		&user.ID, &user.Email, &user.Name,
		&user.PasswordHash, &user.Role,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	return user, nil
}

// isUniqueViolation checks if the error is a PostgreSQL unique constraint violation.
func isUniqueViolation(err error) bool {
	return err != nil && (contains(err.Error(), "23505") || contains(err.Error(), "unique constraint"))
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsStr(s, substr))
}

func containsStr(s, sub string) bool {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
