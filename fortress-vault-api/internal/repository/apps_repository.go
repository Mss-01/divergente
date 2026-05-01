package repository

import (
	"context"
	"errors"
	"time"

	"fortress-vault-api/internal/models"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

// ErrDuplicatePassword is returned when a password hash already exists in the user's vault.
var ErrDuplicatePassword = errors.New("password already used in another application")

// AppsRepository handles all Firestore operations for the apps subcollection.
type AppsRepository struct {
	client *firestore.Client
}

func NewAppsRepository(client *firestore.Client) *AppsRepository {
	return &AppsRepository{client: client}
}

func (r *AppsRepository) appsCol(userID string) *firestore.CollectionRef {
	return r.client.Collection("users").Doc(userID).Collection("apps")
}

// List returns all app entries for a user.
func (r *AppsRepository) List(ctx context.Context, userID string) ([]models.AppEntry, error) {
	iter := r.appsCol(userID).Documents(ctx)
	defer iter.Stop()

	var entries []models.AppEntry
	for {
		doc, err := iter.Next()
		if errors.Is(err, iterator.Done) {
			break
		}
		if err != nil {
			return nil, err
		}
		var entry models.AppEntry
		if err := doc.DataTo(&entry); err != nil {
			return nil, err
		}
		entry.ID = doc.Ref.ID
		entries = append(entries, entry)
	}
	return entries, nil
}

// Get returns a single app entry by ID.
func (r *AppsRepository) Get(ctx context.Context, userID, appID string) (*models.AppEntry, error) {
	doc, err := r.appsCol(userID).Doc(appID).Get(ctx)
	if err != nil {
		return nil, err
	}
	var entry models.AppEntry
	if err := doc.DataTo(&entry); err != nil {
		return nil, err
	}
	entry.ID = doc.Ref.ID
	return &entry, nil
}

// Create persists a new app entry. Returns ErrDuplicatePassword if the hash already exists.
func (r *AppsRepository) Create(ctx context.Context, userID string, entry *models.AppEntry) (*models.AppEntry, error) {
	if err := r.checkHashUniqueness(ctx, userID, entry.PasswordHash, ""); err != nil {
		return nil, err
	}
	entry.LastUpdated = time.Now()
	ref, _, err := r.appsCol(userID).Add(ctx, entry)
	if err != nil {
		return nil, err
	}
	entry.ID = ref.ID
	return entry, nil
}

// Update replaces an existing app entry. Returns ErrDuplicatePassword if the new hash conflicts.
func (r *AppsRepository) Update(ctx context.Context, userID, appID string, entry *models.AppEntry) (*models.AppEntry, error) {
	if err := r.checkHashUniqueness(ctx, userID, entry.PasswordHash, appID); err != nil {
		return nil, err
	}
	entry.LastUpdated = time.Now()
	_, err := r.appsCol(userID).Doc(appID).Set(ctx, entry)
	if err != nil {
		return nil, err
	}
	entry.ID = appID
	return entry, nil
}

// Delete removes an app entry.
func (r *AppsRepository) Delete(ctx context.Context, userID, appID string) error {
	_, err := r.appsCol(userID).Doc(appID).Delete(ctx)
	return err
}

// checkHashUniqueness queries all docs for a matching passwordHash.
// excludeID is the current doc's ID when updating (to allow saving the same password).
func (r *AppsRepository) checkHashUniqueness(ctx context.Context, userID, hash, excludeID string) error {
	iter := r.appsCol(userID).Where("passwordHash", "==", hash).Documents(ctx)
	defer iter.Stop()

	for {
		doc, err := iter.Next()
		if errors.Is(err, iterator.Done) {
			break
		}
		if err != nil {
			return err
		}
		if doc.Ref.ID != excludeID {
			return ErrDuplicatePassword
		}
	}
	return nil
}
