package services

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"io"
	"os"
)

// CryptoService handles AES-256-GCM encryption and SHA-256 hashing of passwords.
type CryptoService struct {
	key []byte // 32-byte AES-256 key
}

// NewCryptoService creates a CryptoService using the AES_KEY environment variable.
// The key must be exactly 32 bytes (256 bits) when decoded from hex.
func NewCryptoService() (*CryptoService, error) {
	hexKey := os.Getenv("AES_KEY")
	if hexKey == "" {
		return nil, errors.New("AES_KEY environment variable is not set")
	}
	key, err := hex.DecodeString(hexKey)
	if err != nil || len(key) != 32 {
		return nil, errors.New("AES_KEY must be a 64-character hex string (32 bytes)")
	}
	return &CryptoService{key: key}, nil
}

// Encrypt encrypts plaintext using AES-256-GCM and returns a base64-encoded ciphertext.
func (s *CryptoService) Encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(s.key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	// Prepend nonce to ciphertext so we can extract it during decryption.
	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt decrypts a base64-encoded AES-256-GCM ciphertext.
func (s *CryptoService) Decrypt(encoded string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(s.key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// Hash returns the SHA-256 hex digest of the given password.
// Used for fast uniqueness checks across a user's vault.
func (s *CryptoService) Hash(password string) string {
	sum := sha256.Sum256([]byte(password))
	return hex.EncodeToString(sum[:])
}
