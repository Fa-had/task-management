package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/Fa-had/task_management/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TaskRepository handles all task-related database operations.
type TaskRepository struct {
	db *pgxpool.Pool
}

func NewTaskRepository(db *pgxpool.Pool) *TaskRepository {
	return &TaskRepository{db: db}
}

var allowedSortColumns = map[string]string{
	"created_at": "created_at",
	"updated_at": "updated_at",
	"due_date":   "due_date",
	"priority":   "priority",
	"title":      "title",
}

// List returns a paginated, filtered, and sorted list of tasks for a user.
func (r *TaskRepository) List(ctx context.Context, userID string, q models.ListTasksQuery) ([]models.Task, int, error) {
	args := []interface{}{userID}
	argIdx := 2
	where := []string{"user_id = $1", "status != 'archived'"}

	if q.Search != "" {
		where = append(where, fmt.Sprintf("title ILIKE $%d", argIdx))
		args = append(args, "%"+q.Search+"%")
		argIdx++
	}

	if q.Status != "" {
		where = append(where, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, q.Status)
		argIdx++
	}

	if q.Priority != "" {
		where = append(where, fmt.Sprintf("priority = $%d", argIdx))
		args = append(args, q.Priority)
		argIdx++
	}

	whereClause := "WHERE " + strings.Join(where, " AND ")

	// Safe sort column lookup
	sortCol, ok := allowedSortColumns[q.SortBy]
	if !ok {
		sortCol = "created_at"
	}
	order := "DESC"
	if strings.ToLower(q.Order) == "asc" {
		order = "ASC"
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tasks %s", whereClause)
	var total int
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count tasks: %w", err)
	}

	// Paginated query
	offset := (q.Page - 1) * q.Limit
	listQuery := fmt.Sprintf(`
		SELECT id, user_id, title, description, status, priority, due_date, completed_at, created_at, updated_at
		FROM tasks %s
		ORDER BY %s %s
		LIMIT $%d OFFSET $%d
	`, whereClause, sortCol, order, argIdx, argIdx+1)
	args = append(args, q.Limit, offset)

	rows, err := r.db.Query(ctx, listQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list tasks: %w", err)
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		var t models.Task
		if err := rows.Scan(
			&t.ID, &t.UserID, &t.Title, &t.Description,
			&t.Status, &t.Priority, &t.DueDate, &t.CompletedAt,
			&t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		tasks = append(tasks, t)
	}

	return tasks, total, nil
}

// Create inserts a new task.
func (r *TaskRepository) Create(ctx context.Context, task *models.Task) error {
	query := `
		INSERT INTO tasks (id, user_id, title, description, status, priority, due_date, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		RETURNING created_at, updated_at
	`
	return r.db.QueryRow(ctx, query,
		task.ID, task.UserID, task.Title, task.Description,
		task.Status, task.Priority, task.DueDate,
	).Scan(&task.CreatedAt, &task.UpdatedAt)
}

// FindByID fetches a single task by ID.
func (r *TaskRepository) FindByID(ctx context.Context, id string) (*models.Task, error) {
	query := `
		SELECT id, user_id, title, description, status, priority, due_date, completed_at, created_at, updated_at
		FROM tasks
		WHERE id = $1
	`
	row := r.db.QueryRow(ctx, query, id)
	t := &models.Task{}
	err := row.Scan(
		&t.ID, &t.UserID, &t.Title, &t.Description,
		&t.Status, &t.Priority, &t.DueDate, &t.CompletedAt,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("task not found")
		}
		return nil, fmt.Errorf("failed to find task: %w", err)
	}
	return t, nil
}

// Update applies partial updates to a task.
func (r *TaskRepository) Update(ctx context.Context, task *models.Task) error {
	query := `
		UPDATE tasks
		SET title = $1, description = $2, status = $3, priority = $4,
		    due_date = $5, completed_at = $6, updated_at = NOW()
		WHERE id = $7
		RETURNING updated_at
	`
	return r.db.QueryRow(ctx, query,
		task.Title, task.Description, task.Status, task.Priority,
		task.DueDate, task.CompletedAt, task.ID,
	).Scan(&task.UpdatedAt)
}

// Delete soft-deletes a task by setting status to 'archived'.
// Use hard delete if preferred.
func (r *TaskRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, "DELETE FROM tasks WHERE id = $1", id)
	return err
}
