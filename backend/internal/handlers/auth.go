package handlers

import (
	"net/http"

	"github.com/Fa-had/task_management/internal/config"
	"github.com/Fa-had/task_management/internal/models"
	"github.com/Fa-had/task_management/internal/repository"
	"github.com/Fa-had/task_management/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// AuthHandler handles authentication-related HTTP requests.
type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(db *pgxpool.Pool, cfg *config.Config) *AuthHandler {
	userRepo := repository.NewUserRepository(db)
	authSvc := services.NewAuthService(userRepo, cfg)
	return &AuthHandler{authService: authSvc}
}

// Signup godoc
// POST /auth/signup
func (h *AuthHandler) Signup(c *gin.Context) {
	var req models.SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, models.NewError("VALIDATION_ERROR", err.Error()))
		return
	}

	resp, err := h.authService.Signup(c.Request.Context(), req)
	if err != nil {
		switch err.Error() {
		case "email already registered":
			c.JSON(http.StatusConflict, models.NewError("EMAIL_CONFLICT", err.Error()))
		default:
			c.JSON(http.StatusInternalServerError, models.NewError("INTERNAL_ERROR", "Failed to create account"))
		}
		return
	}

	// Set refresh token in httpOnly cookie (same as Login)
	isSecure := h.authService.Config().Env == "production"
	c.SetCookie("refresh_token", resp.RefreshToken, 7*24*60*60, "/", "", isSecure, true)
	c.JSON(http.StatusCreated, resp)
}

// Login godoc
// POST /auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, models.NewError("VALIDATION_ERROR", err.Error()))
		return
	}

	resp, err := h.authService.Login(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.NewError("INVALID_CREDENTIALS", "Invalid email or password"))
		return
	}

	// Set refresh token in httpOnly cookie
	// Only set Secure flag in production (HTTPS). In dev (HTTP), browsers reject Secure cookies.
	isSecure := h.authService.Config().Env == "production"
	// Set domain to empty string so cookie is scoped to the request's host,
	// allowing it to work correctly with cross-origin requests (frontend on :3000, API on :8080).
	c.SetCookie("refresh_token", resp.RefreshToken, 7*24*60*60, "/", "", isSecure, true)
	c.JSON(http.StatusOK, resp)
}

// RefreshToken godoc
// POST /auth/refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.NewError("MISSING_TOKEN", "Refresh token not found"))
		return
	}

	resp, err := h.authService.RefreshToken(c.Request.Context(), refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.NewError("INVALID_TOKEN", "Invalid or expired refresh token"))
		return
	}

	c.JSON(http.StatusOK, resp)
}

// Logout godoc
// POST /auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	isSecure := h.authService.Config().Env == "production"
	c.SetCookie("refresh_token", "", -1, "/", "", isSecure, true)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}
