package models

import (
	"time"
)

// ─── User ────────────────────────────────────────────────────────────────────

type Role string

const (
	RoleUser  Role = "user"
	RoleAdmin Role = "admin"
)

// User represents an authenticated application user.
type User struct {
	ID           string    `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	Name         string    `json:"name" db:"name"`
	PasswordHash string    `json:"-" db:"password_hash"`
	Role         Role      `json:"role" db:"role"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// UserResponse is the safe public representation (no password hash).
type UserResponse struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Role      Role      `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

// ─── Task ────────────────────────────────────────────────────────────────────

type Status string
type Priority string

const (
	StatusTodo       Status = "todo"
	StatusInProgress Status = "in_progress"
	StatusDone       Status = "done"
	StatusArchived   Status = "archived"
)

const (
	PriorityLow    Priority = "low"
	PriorityMedium Priority = "medium"
	PriorityHigh   Priority = "high"
	PriorityUrgent Priority = "urgent"
)

// Task represents a single task in the system.
type Task struct {
	ID          string    `json:"id" db:"id"`
	UserID      string    `json:"user_id" db:"user_id"`
	Title       string    `json:"title" db:"title"`
	Description string    `json:"description" db:"description"`
	Status      Status    `json:"status" db:"status"`
	Priority    Priority  `json:"priority" db:"priority"`
	DueDate     *time.Time `json:"due_date" db:"due_date"`
	CompletedAt *time.Time `json:"completed_at" db:"completed_at"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// ─── Request / Response DTOs ─────────────────────────────────────────────────

type SignupRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8,max=72"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	User         UserResponse `json:"user"`
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
}

type CreateTaskRequest struct {
	Title       string     `json:"title" binding:"required,min=1,max=255"`
	Description string     `json:"description" binding:"max=2000"`
	Status      Status     `json:"status" binding:"omitempty,oneof=todo in_progress done archived"`
	Priority    Priority   `json:"priority" binding:"omitempty,oneof=low medium high urgent"`
	DueDate     *time.Time `json:"due_date"`
}

type UpdateTaskRequest struct {
	Title       *string    `json:"title" binding:"omitempty,min=1,max=255"`
	Description *string    `json:"description" binding:"omitempty,max=2000"`
	Status      *Status    `json:"status" binding:"omitempty,oneof=todo in_progress done archived"`
	Priority    *Priority  `json:"priority" binding:"omitempty,oneof=low medium high urgent"`
	DueDate     *time.Time `json:"due_date"`
}

type ListTasksQuery struct {
	Page     int    `form:"page,default=1" binding:"min=1"`
	Limit    int    `form:"limit,default=10" binding:"min=1,max=100"`
	Search   string `form:"search"`
	Status   string `form:"status"`
	Priority string `form:"priority"`
	SortBy   string `form:"sort_by,default=created_at"`
	Order    string `form:"order,default=desc"`
}

type PaginatedTasksResponse struct {
	Tasks      []Task `json:"tasks"`
	Total      int    `json:"total"`
	Page       int    `json:"page"`
	Limit      int    `json:"limit"`
	TotalPages int    `json:"total_pages"`
}

// ─── Error ───────────────────────────────────────────────────────────────────

type ErrorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

func NewError(code, message string) ErrorResponse {
	return ErrorResponse{Error: ErrorDetail{Code: code, Message: message}}
}
