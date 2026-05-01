package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                    string
	FirebaseCredentialsPath string
	FirebaseCredentialsJSON string // Used in production (Render) instead of file
	FirebaseProjectID       string
	AllowedOrigins          string
}

func Load() *Config {
	// .env is optional — ignored in production
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	return &Config{
		Port:                    getEnv("PORT", "8080"),
		FirebaseCredentialsPath: getEnv("FIREBASE_CREDENTIALS_PATH", ""),
		FirebaseCredentialsJSON: getEnv("FIREBASE_CREDENTIALS_JSON", ""),
		FirebaseProjectID:       getEnv("FIREBASE_PROJECT_ID", ""),
		AllowedOrigins:          getEnv("ALLOWED_ORIGINS", "http://localhost:4200"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
