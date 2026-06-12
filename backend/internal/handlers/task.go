package handlers

import (
	"net/http"

	"github.com/Fa-had/task_management/internal/config"
	"github.com/Fa-had/task_management/internal/middleware"
	"github.com/Fa-had/task_management/internal/models"
	"github.com/Fa-had/task_management/internal/repository"
	"github.com/Fa-had/task_management/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TaskHandler handles task-related HTTP requests.
type TaskHandler struct {
	taskService *services.TaskService
}

func NewTaskHandler(db *pgxpool.Pool, cfg *config.Config) *TaskHandler {
	taskRepo := repository.NewTaskRepository(db)
	taskSvc := services.NewTaskService(taskRepo)
	return &TaskHandler{taskService: taskSvc}
}

// ListTasks godoc
// GET /tasks?page=1&limit=10&search=&status=&sort_by=created_at&order=desc
func (h *TaskHandler) ListTasks(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var query models.ListTasksQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, models.NewError("INVALID_QUERY", err.Error()))
		return
	}

	result, err := h.taskService.ListTasks(c.Request.Context(), userID, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.NewError("INTERNAL_ERROR", "Failed to fetch tasks"))
		return
	}

	c.JSON(http.StatusOK, result)
}

// CreateTask godoc
// POST /tasks
func (h *TaskHandler) CreateTask(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, models.NewError("VALIDATION_ERROR", err.Error()))
		return
	}

	task, err := h.taskService.CreateTask(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.NewError("INTERNAL_ERROR", "Failed to create task"))
		return
	}

	c.JSON(http.StatusCreated, task)
}

// GetTask godoc
// GET /tasks/:id
func (h *TaskHandler) GetTask(c *gin.Context) {
	userID := middleware.GetUserID(c)
	taskID := c.Param("id")

	task, err := h.taskService.GetTask(c.Request.Context(), userID, taskID)
	if err != nil {
		switch err.Error() {
		case "task not found":
			c.JSON(http.StatusNotFound, models.NewError("NOT_FOUND", "Task not found"))
		case "access denied":
			c.JSON(http.StatusForbidden, models.NewError("FORBIDDEN", "You do not have access to this task"))
		default:
			c.JSON(http.StatusInternalServerError, models.NewError("INTERNAL_ERROR", "Failed to fetch task"))
		}
		return
	}

	c.JSON(http.StatusOK, task)
}

// UpdateTask godoc
// PATCH /tasks/:id
func (h *TaskHandler) UpdateTask(c *gin.Context) {
	userID := middleware.GetUserID(c)
	taskID := c.Param("id")

	var req models.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, models.NewError("VALIDATION_ERROR", err.Error()))
		return
	}

	task, err := h.taskService.UpdateTask(c.Request.Context(), userID, taskID, req)
	if err != nil {
		switch err.Error() {
		case "task not found":
			c.JSON(http.StatusNotFound, models.NewError("NOT_FOUND", "Task not found"))
		case "access denied":
			c.JSON(http.StatusForbidden, models.NewError("FORBIDDEN", "You do not have access to this task"))
		default:
			c.JSON(http.StatusInternalServerError, models.NewError("INTERNAL_ERROR", "Failed to update task"))
		}
		return
	}

	c.JSON(http.StatusOK, task)
}

// DeleteTask godoc
// DELETE /tasks/:id
func (h *TaskHandler) DeleteTask(c *gin.Context) {
	userID := middleware.GetUserID(c)
	taskID := c.Param("id")

	if err := h.taskService.DeleteTask(c.Request.Context(), userID, taskID); err != nil {
		switch err.Error() {
		case "task not found":
			c.JSON(http.StatusNotFound, models.NewError("NOT_FOUND", "Task not found"))
		case "access denied":
			c.JSON(http.StatusForbidden, models.NewError("FORBIDDEN", "You do not have access to this task"))
		default:
			c.JSON(http.StatusInternalServerError, models.NewError("INTERNAL_ERROR", "Failed to delete task"))
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}
