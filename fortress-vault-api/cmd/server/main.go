package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"fortress-vault-api/config"
	"fortress-vault-api/internal/handlers"
	"fortress-vault-api/internal/middleware"
	"fortress-vault-api/internal/repository"
	"fortress-vault-api/internal/services"

	firebase "firebase.google.com/go/v4"

	"github.com/gin-gonic/gin"
	"google.golang.org/api/option"
)

func main() {
	cfg := config.Load()

	// ── Firebase Admin SDK ────────────────────────────────────────────────────
	ctx := context.Background()

	// Support both file-based (local) and JSON env var (production/Render)
	var opt option.ClientOption
	if cfg.FirebaseCredentialsJSON != "" {
		opt = option.WithCredentialsJSON([]byte(cfg.FirebaseCredentialsJSON))
	} else if cfg.FirebaseCredentialsPath != "" {
		opt = option.WithCredentialsFile(cfg.FirebaseCredentialsPath)
	} else {
		// Try default credentials (GCP environment)
		log.Println("No Firebase credentials configured, using application default credentials")
		opt = option.WithoutAuthentication()
	}

	// Write JSON credentials to temp file if provided via env var
	if cfg.FirebaseCredentialsJSON != "" {
		tmpFile, err := os.CreateTemp("", "firebase-creds-*.json")
		if err != nil {
			log.Fatalf("error creating temp credentials file: %v", err)
		}
		if _, err := tmpFile.WriteString(cfg.FirebaseCredentialsJSON); err != nil {
			log.Fatalf("error writing credentials: %v", err)
		}
		tmpFile.Close()
		opt = option.WithCredentialsFile(tmpFile.Name())
		defer os.Remove(tmpFile.Name())
	}

	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		log.Fatalf("error initializing Firebase app: %v", err)
	}

	authClient, err := app.Auth(ctx)
	if err != nil {
		log.Fatalf("error getting Firebase Auth client: %v", err)
	}

	firestoreClient, err := app.Firestore(ctx)
	if err != nil {
		log.Fatalf("error getting Firestore client: %v", err)
	}
	defer firestoreClient.Close()

	// ── Services & Repositories ───────────────────────────────────────────────
	cryptoSvc, err := services.NewCryptoService()
	if err != nil {
		log.Fatalf("error initializing crypto service: %v", err)
	}

	breachSvc := services.NewBreachService()
	appsRepo := repository.NewAppsRepository(firestoreClient)
	appsHandler := handlers.NewAppsHandler(appsRepo, cryptoSvc)
	auditHandler := handlers.NewAuditHandler(appsRepo, breachSvc, firestoreClient)

	// ── Gin Router ────────────────────────────────────────────────────────────
	r := gin.Default()
	r.Use(corsMiddleware(cfg.AllowedOrigins))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api/v1")
	api.Use(middleware.FirebaseAuth(authClient))
	{
		// Apps CRUD
		api.GET("/apps", appsHandler.List)
		api.GET("/apps/:id", appsHandler.Get)
		api.POST("/apps", appsHandler.Create)
		api.PUT("/apps/:id", appsHandler.Update)
		api.DELETE("/apps/:id", appsHandler.Delete)
		api.GET("/stats", appsHandler.Stats)

		// Security Audit — Breach Monitor
		api.GET("/audit/scan", auditHandler.Scan)
		api.GET("/audit/status", auditHandler.Status)
	}

	log.Printf("Divergente API listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

func corsMiddleware(allowedOrigins string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", allowedOrigins)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
