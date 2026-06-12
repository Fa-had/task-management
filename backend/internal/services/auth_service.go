package services

import (
	"context"
	"errors"
	"time"

	"github.com/Fa-had/task_management/internal/config"
	"github.com/Fa-had/task_management/internal/models"
	"github.com/Fa-had/task_management/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles authentication business logic.
type AuthService struct {
	userRepo *repository.UserRepository
	cfg      *config.Config
}

func NewAuthService(userRepo *repository.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{userRepo: userRepo, cfg: cfg}
}

func (s *AuthService) Signup(ctx context.Context, req models.SignupRequest) (*models.AuthResponse, error) {
	// Hash password with bcrypt (cost 12)
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	user := &models.User{
		ID:           uuid.New().String(),
		Email:        req.Email,
		Name:         req.Name,
		PasswordHash: string(hash),
		Role:         models.RoleUser,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	return s.buildAuthResponse(user)
}

func (s *AuthService) Login(ctx context.Context, req models.LoginRequest) (*models.AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	return s.buildAuthResponse(user)
}

func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*models.AuthResponse, error) {
	claims, err := s.parseToken(refreshToken)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	tokenType, _ := claims["type"].(string)
	if tokenType != "refresh" {
		return nil, errors.New("not a refresh token")
	}

	userID, _ := claims["sub"].(string)
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	return s.buildAuthResponse(user)
}

// ─── Token helpers ────────────────────────────────────────────────────────────

func (s *AuthService) buildAuthResponse(user *models.User) (*models.AuthResponse, error) {
	accessToken, err := s.generateToken(user, "access", s.cfg.JWTAccessExpiry)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.generateToken(user, "refresh", s.cfg.JWTRefreshExpiry)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		User: models.UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			Name:      user.Name,
			Role:      user.Role,
			CreatedAt: user.CreatedAt,
		},
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthService) generateToken(user *models.User, tokenType string, expiry time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"sub":  user.ID,
		"role": string(user.Role),
		"type": tokenType,
		"exp":  time.Now().Add(expiry).Unix(),
		"iat":  time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

func (s *AuthService) parseToken(tokenStr string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid claims")
	}
	return claims, nil
}
