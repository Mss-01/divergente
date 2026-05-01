package handlers

import (
	"errors"
	"log"
	"math"
	"net/http"
	"time"

	"fortress-vault-api/internal/middleware"
	"fortress-vault-api/internal/models"
	"fortress-vault-api/internal/repository"
	"fortress-vault-api/internal/services"

	"github.com/gin-gonic/gin"
)

// AppsHandler handles HTTP requests for the /apps resource.
type AppsHandler struct {
	repo   *repository.AppsRepository
	crypto *services.CryptoService
}

func NewAppsHandler(repo *repository.AppsRepository, crypto *services.CryptoService) *AppsHandler {
	return &AppsHandler{repo: repo, crypto: crypto}
}

// GET /api/v1/apps
func (h *AppsHandler) List(c *gin.Context) {
	userID := c.GetString(middleware.UserIDKey)
	entries, err := h.repo.List(c.Request.Context(), userID)
	if err != nil {
		log.Printf("[ERROR] List apps for user %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve applications"})
		return
	}
	// Never expose encrypted passwords in list responses.
	for i := range entries {
		entries[i].EncryptedPassword = ""
		entries[i].PasswordHash = ""
	}
	if entries == nil {
		entries = []models.AppEntry{}
	}
	c.JSON(http.StatusOK, entries)
}

// GET /api/v1/apps/:id
func (h *AppsHandler) Get(c *gin.Context) {
	userID := c.GetString(middleware.UserIDKey)
	entry, err := h.repo.Get(c.Request.Context(), userID, c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}
	// Decrypt password for the detail view.
	plain, err := h.crypto.Decrypt(entry.EncryptedPassword)
	if err != nil {
		log.Printf("[ERROR] Decrypt password for app %s: %v", c.Param("id"), err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "decryption failed"})
		return
	}
	entry.EncryptedPassword = plain
	entry.PasswordHash = "" // never expose hash
	c.JSON(http.StatusOK, entry)
}

// POST /api/v1/apps
func (h *AppsHandler) Create(c *gin.Context) {
	userID := c.GetString(middleware.UserIDKey)

	var req models.AppEntryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entry, err := h.buildEntry(req)
	if err != nil {
		log.Printf("[ERROR] Build entry for user %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process password"})
		return
	}

	created, err := h.repo.Create(c.Request.Context(), userID, entry)
	if errors.Is(err, repository.ErrDuplicatePassword) {
		// REQ-ENG-03: 409 with the exact message the frontend expects.
		c.JSON(http.StatusConflict, gin.H{"error": "Security Violation Detected"})
		return
	}
	if err != nil {
		log.Printf("[ERROR] Create app for user %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save application"})
		return
	}

	created.EncryptedPassword = ""
	created.PasswordHash = ""
	c.JSON(http.StatusCreated, created)
}

// PUT /api/v1/apps/:id
func (h *AppsHandler) Update(c *gin.Context) {
	userID := c.GetString(middleware.UserIDKey)

	var req models.AppEntryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entry, err := h.buildEntry(req)
	if err != nil {
		log.Printf("[ERROR] Build entry for user %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process password"})
		return
	}

	updated, err := h.repo.Update(c.Request.Context(), userID, c.Param("id"), entry)
	if errors.Is(err, repository.ErrDuplicatePassword) {
		c.JSON(http.StatusConflict, gin.H{"error": "Security Violation Detected"})
		return
	}
	if err != nil {
		log.Printf("[ERROR] Update app %s for user %s: %v", c.Param("id"), userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update application"})
		return
	}

	updated.EncryptedPassword = ""
	updated.PasswordHash = ""
	c.JSON(http.StatusOK, updated)
}

// DELETE /api/v1/apps/:id
func (h *AppsHandler) Delete(c *gin.Context) {
	userID := c.GetString(middleware.UserIDKey)
	if err := h.repo.Delete(c.Request.Context(), userID, c.Param("id")); err != nil {
		log.Printf("[ERROR] Delete app %s for user %s: %v", c.Param("id"), userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete application"})
		return
	}
	c.Status(http.StatusNoContent)
}

// GET /api/v1/stats
func (h *AppsHandler) Stats(c *gin.Context) {
	userID := c.GetString(middleware.UserIDKey)
	entries, err := h.repo.List(c.Request.Context(), userID)
	if err != nil {
		log.Printf("[ERROR] Stats for user %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve stats"})
		return
	}

	stats := models.VaultStats{Total: len(entries)}
	now := time.Now()
	sevenDays := now.Add(7 * 24 * time.Hour)

	for _, e := range entries {
		switch e.Strength {
		case "Strong":
			stats.Strong++
		case "Medium":
			stats.Medium++
		default:
			stats.Weak++
		}
		if !e.ExpirationDate.IsZero() && e.ExpirationDate.Before(sevenDays) {
			stats.ExpiringSoon++
		}
	}

	c.JSON(http.StatusOK, stats)
}

// ── Private helpers ───────────────────────────────────────────────────────────

// buildEntry encrypts the password, hashes it, and derives expiration.
func (h *AppsHandler) buildEntry(req models.AppEntryRequest) (*models.AppEntry, error) {
	encrypted, err := h.crypto.Encrypt(req.Password)
	if err != nil {
		return nil, err
	}
	hash := h.crypto.Hash(req.Password)

	// Derive strength from score if not provided by client.
	strength := req.Strength
	if strength == "" {
		strength = "Weak"
	}

	return &models.AppEntry{
		AppName:           req.AppName,
		URL:               req.URL,
		Username:          req.Username,
		EncryptedPassword: encrypted,
		PasswordHash:      hash,
		Strength:          strength,
		CrackTimeSeconds:  req.CrackTimeSeconds,
		ExpirationDate:    calcExpiration(req.CrackTimeSeconds),
		LastUpdated:       time.Now(),
	}, nil
}

// calcExpiration maps crack time in seconds to an expiration date.
// Cap: 90 days per REQ-ENG-02.
func calcExpiration(crackSec float64) time.Time {
	days := crackSec / 86400
	var expDays float64
	switch {
	case days < 7:
		expDays = 7
	case days < 30:
		expDays = 14
	case days < 365:
		expDays = 30
	default:
		expDays = 90
	}
	return time.Now().Add(time.Duration(math.Round(expDays)) * 24 * time.Hour)
}
