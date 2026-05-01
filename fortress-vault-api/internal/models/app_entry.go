package models

import "time"

// AppEntry represents a single credential record stored in Firestore.
// Collection path: users/{userID}/apps/{appID}
type AppEntry struct {
	ID                string `json:"id" firestore:"-"`
	AppName           string `json:"appName" firestore:"appName"`
	URL               string `json:"url" firestore:"url"`
	Username          string `json:"username" firestore:"username"`
	EncryptedPassword string `json:"encryptedPassword" firestore:"encryptedPassword"`
	// SHA-256 hash of the plain-text password — used for uniqueness checks.
	PasswordHash     string    `json:"passwordHash" firestore:"passwordHash"`
	Strength         string    `json:"strength" firestore:"strength"` // "Strong" | "Medium" | "Weak"
	CrackTimeSeconds float64   `json:"crackTimeSeconds" firestore:"crackTimeSeconds"`
	ExpirationDate   time.Time `json:"expirationDate" firestore:"expirationDate"`
	LastUpdated      time.Time `json:"lastUpdated" firestore:"lastUpdated"`
	// Security Audit — Breach Monitor fields
	IsCompromised bool   `json:"isCompromised" firestore:"isCompromised"`
	BreachDetails string `json:"breachDetails" firestore:"breachDetails"`
}

// AppEntryRequest is the payload accepted by POST /apps and PUT /apps/:id.
type AppEntryRequest struct {
	AppName  string `json:"appName" binding:"required"`
	URL      string `json:"url" binding:"required"`
	Username string `json:"username" binding:"required"`
	// Plain-text password — encrypted and hashed server-side.
	Password string `json:"password" binding:"required,min=1"`
	// Strength and crack time are computed by zxcvbn on the frontend and sent here.
	Strength         string  `json:"strength"`
	CrackTimeSeconds float64 `json:"crackTimeSeconds"`
}

// VaultStats is returned by GET /stats.
type VaultStats struct {
	Total        int `json:"total"`
	Strong       int `json:"strong"`
	Medium       int `json:"medium"`
	Weak         int `json:"weak"`
	ExpiringSoon int `json:"expiringSoon"` // entries expiring in < 7 days
}
