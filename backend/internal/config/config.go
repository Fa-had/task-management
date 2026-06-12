package config

import (
	"os"
	"strings"
	"time"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	Port              string
	Env               string
	DatabaseURL       string
	JWTSecret         string
	JWTAccessExpiry   time.Duration
	JWTRefreshExpiry  time.Duration
	CORSOrigins       []string
}

// Load reads configuration from environment variables with safe defaults.
func Load() *Config {
	accessExpiry, _ := time.ParseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m"))
	refreshExpiry, _ := time.ParseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h"))

	originsRaw := getEnv("CORS_ORIGINS", "http://localhost:3000")
	origins := strings.Split(originsRaw, ",")

	return &Config{
		Port:             getEnv("PORT", "8080"),
		Env:              getEnv("ENV", "development"),
		DatabaseURL:      getEnv("DATABASE_URL", ""),
		JWTSecret:        getEnv("JWT_SECRET", ""),
		JWTAccessExpiry:  accessExpiry,
		JWTRefreshExpiry: refreshExpiry,
		CORSOrigins:      origins,
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
