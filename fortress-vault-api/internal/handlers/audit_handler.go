package handlers

import (
	"log"
	"net/http"
	"time"

	"fortress-vault-api/internal/middleware"
	"fortress-vault-api/internal/models"
	"fortress-vault-api/internal/repository"
	"fortress-vault-api/internal/services"

	"cloud.google.com/go/firestore"

	"github.com/gin-gonic/gin"
)

// AuditResult is the response item for each scanned app.
type AuditResult struct {
	models.AppEntry
	IsCompromised bool   `json:"isCompromised"`
	BreachDetails string `json:"breachDetails"`
}

// AuditSummary is the full response from GET /api/v1/audit/scan.
type AuditSummary struct {
	TotalScanned     int           `json:"totalScanned"`
	TotalCompromised int           `json:"totalCompromised"`
	ScannedAt        time.Time     `json:"scannedAt"`
	Results          []AuditResult `json:"results"`
}

// AuditHandler handles breach monitoring requests.
type AuditHandler struct {
	repo            *repository.AppsRepository
	breachSvc       *services.BreachService
	firestoreClient *firestore.Client
}

func NewAuditHandler(repo *repository.AppsRepository, breachSvc *services.BreachService, fs *firestore.Client) *AuditHandler {
	return &AuditHandler{repo: repo, breachSvc: breachSvc, firestoreClient: fs}
}

// GET /api/v1/audit/scan
// Scans all user apps against HIBP and returns breach status.
func (h *AuditHandler) Scan(c *gin.Context) {
	userID := c.GetString(middleware.UserIDKey)

	apps, err := h.repo.List(c.Request.Context(), userID)
	if err != nil {
		log.Printf("[ERROR] Audit scan list apps for user %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve applications"})
		return
	}

	summary := AuditSummary{
		TotalScanned: len(apps),
		ScannedAt:    time.Now(),
		Results:      make([]AuditResult, 0, len(apps)),
	}

	for i, app := range apps {
		if i > 0 {
			// Respect HIBP rate limit between requests
			h.breachSvc.ThrottledDelay()
		}

		compromised, details, err := h.breachSvc.IsBreached(app.Username)
		if err != nil {
			log.Printf("[WARN] Breach check failed for app %s: %v", app.ID, err)
			// Continue scanning other apps even if one fails
			compromised = false
			details = ""
		}

		// Persist result to Firestore
		if app.ID != "" {
			_, updateErr := h.firestoreClient.
				Collection("users").Doc(userID).
				Collection("apps").Doc(app.ID).
				Update(c.Request.Context(), []firestore.Update{
					{Path: "isCompromised", Value: compromised},
					{Path: "breachDetails", Value: details},
				})
			if updateErr != nil {
				log.Printf("[WARN] Failed to update breach status for app %s: %v", app.ID, updateErr)
			}
		}

		result := AuditResult{
			AppEntry:      app,
			IsCompromised: compromised,
			BreachDetails: details,
		}
		result.EncryptedPassword = "" // never expose
		result.PasswordHash = ""

		if compromised {
			summary.TotalCompromised++
		}

		summary.Results = append(summary.Results, result)
	}

	c.JSON(http.StatusOK, summary)
}

// GET /api/v1/audit/status
// Returns the persisted breach status without re-scanning.
func (h *AuditHandler) Status(c *gin.Context) {
	userID := c.GetString(middleware.UserIDKey)

	apps, err := h.repo.List(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve applications"})
		return
	}

	results := make([]AuditResult, 0, len(apps))
	compromised := 0

	for _, app := range apps {
		result := AuditResult{
			AppEntry:      app,
			IsCompromised: app.IsCompromised,
			BreachDetails: app.BreachDetails,
		}
		result.EncryptedPassword = ""
		result.PasswordHash = ""
		if app.IsCompromised {
			compromised++
		}
		results = append(results, result)
	}

	c.JSON(http.StatusOK, AuditSummary{
		TotalScanned:     len(apps),
		TotalCompromised: compromised,
		ScannedAt:        time.Now(),
		Results:          results,
	})
}
