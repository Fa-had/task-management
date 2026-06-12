package middleware

import (
	"net/http"
	"strings"

	"github.com/Fa-had/task_management/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const userIDKey = "user_id"
const userRoleKey = "user_role"

// AuthRequired validates the JWT Bearer token and injects the user ID into context.
func AuthRequired(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, models.NewError("MISSING_TOKEN", "Authorization header is required"))
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, models.NewError("INVALID_TOKEN", "Authorization header format must be: Bearer <token>"))
			return
		}

		tokenStr := parts[1]
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, models.NewError("INVALID_TOKEN", "Token is invalid or expired"))
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, models.NewError("INVALID_TOKEN", "Invalid token claims"))
			return
		}

		userID, ok := claims["sub"].(string)
		if !ok || userID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, models.NewError("INVALID_TOKEN", "Invalid user ID in token"))
			return
		}

		role, _ := claims["role"].(string)

		c.Set(userIDKey, userID)
		c.Set(userRoleKey, role)
		c.Next()
	}
}

// GetUserID extracts the authenticated user's ID from the Gin context.
func GetUserID(c *gin.Context) string {
	return c.GetString(userIDKey)
}

// GetUserRole extracts the authenticated user's role from the Gin context.
func GetUserRole(c *gin.Context) string {
	return c.GetString(userRoleKey)
}
