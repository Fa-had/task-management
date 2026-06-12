package services

import (
	"context"
	"errors"
	"math"
	"time"

	"github.com/Fa-had/task_management/internal/models"
	"github.com/Fa-had/task_management/internal/repository"
	"github.com/google/uuid"
)

// TaskService handles task-related business logic.
type TaskService struct {
	taskRepo *repository.TaskRepository
}

func NewTaskService(taskRepo *repository.TaskRepository) *TaskService {
	return &TaskService{taskRepo: taskRepo}
}

func (s *TaskService) ListTasks(ctx context.Context, userID string, q models.ListTasksQuery) (*models.PaginatedTasksResponse, error) {
	tasks, total, err := s.taskRepo.List(ctx, userID, q)
	if err != nil {
		return nil, err
	}

	if tasks == nil {
		tasks = []models.Task{}
	}

	totalPages := int(math.Ceil(float64(total) / float64(q.Limit)))

	return &models.PaginatedTasksResponse{
		Tasks:      tasks,
		Total:      total,
		Page:       q.Page,
		Limit:      q.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *TaskService) CreateTask(ctx context.Context, userID string, req models.CreateTaskRequest) (*models.Task, error) {
	status := models.StatusTodo
	if req.Status != "" {
		status = req.Status
	}

	priority := models.PriorityMedium
	if req.Priority != "" {
		priority = req.Priority
	}

	task := &models.Task{
		ID:          uuid.New().String(),
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		Status:      status,
		Priority:    priority,
		DueDate:     req.DueDate,
	}

	if err := s.taskRepo.Create(ctx, task); err != nil {
		return nil, err
	}

	return task, nil
}

func (s *TaskService) GetTask(ctx context.Context, userID, taskID string) (*models.Task, error) {
	task, err := s.taskRepo.FindByID(ctx, taskID)
	if err != nil {
		return nil, err
	}

	if task.UserID != userID {
		return nil, errors.New("access denied")
	}

	return task, nil
}

func (s *TaskService) UpdateTask(ctx context.Context, userID, taskID string, req models.UpdateTaskRequest) (*models.Task, error) {
	task, err := s.taskRepo.FindByID(ctx, taskID)
	if err != nil {
		return nil, err
	}

	if task.UserID != userID {
		return nil, errors.New("access denied")
	}

	// Apply partial updates
	if req.Title != nil {
		task.Title = *req.Title
	}
	if req.Description != nil {
		task.Description = *req.Description
	}
	if req.Status != nil {
		task.Status = *req.Status
		// Set completed_at when marking as done
		if *req.Status == models.StatusDone && task.CompletedAt == nil {
			now := time.Now()
			task.CompletedAt = &now
		}
		if *req.Status != models.StatusDone {
			task.CompletedAt = nil
		}
	}
	if req.Priority != nil {
		task.Priority = *req.Priority
	}
	if req.DueDate != nil {
		task.DueDate = req.DueDate
	}

	if err := s.taskRepo.Update(ctx, task); err != nil {
		return nil, err
	}

	return task, nil
}

func (s *TaskService) DeleteTask(ctx context.Context, userID, taskID string) error {
	task, err := s.taskRepo.FindByID(ctx, taskID)
	if err != nil {
		return err
	}

	if task.UserID != userID {
		return errors.New("access denied")
	}

	return s.taskRepo.Delete(ctx, taskID)
}
