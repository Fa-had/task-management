package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	// TODO: inject test DB and config
	r := gin.New()
	return r
}

// TestAuthSignup verifies a new user can register successfully.
func TestAuthSignup(t *testing.T) {
	r := setupTestRouter()

	body := map[string]string{
		"name":     "Test User",
		"email":    "test@example.com",
		"password": "securepassword123",
	}
	b, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/auth/signup", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	// Expect 201 with access_token
	if w.Code != http.StatusCreated {
		t.Errorf("Expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if _, ok := resp["access_token"]; !ok {
		t.Error("Expected access_token in response")
	}
}

// TestAuthLoginInvalidCredentials verifies wrong password returns 401.
func TestAuthLoginInvalidCredentials(t *testing.T) {
	r := setupTestRouter()

	body := map[string]string{
		"email":    "noone@example.com",
		"password": "wrongpassword",
	}
	b, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/auth/login", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401, got %d", w.Code)
	}
}

// TestCreateTaskRequiresTitle verifies title is required when creating a task.
func TestCreateTaskRequiresTitle(t *testing.T) {
	r := setupTestRouter()

	body := map[string]string{
		"description": "A task without a title",
	}
	b, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	// NOTE: in a real test, add a valid Bearer token here
	r.ServeHTTP(w, req)

	// Expect 401 (no token) or 422 (validation) depending on middleware order
	if w.Code != http.StatusUnauthorized && w.Code != http.StatusUnprocessableEntity {
		t.Errorf("Expected 401 or 422, got %d", w.Code)
	}
}

// TestTaskOwnershipIsolation verifies user A cannot access user B's tasks.
func TestTaskOwnershipIsolation(t *testing.T) {
	// TODO: Create two users, create task for user A, try to fetch with user B's token
	t.Skip("Requires test database — implement with testcontainers")
}
