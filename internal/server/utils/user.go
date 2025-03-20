package utils

import (
	"bytes"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"golang.org/x/crypto/argon2"
)

type UserRole = string

const (
	RoleAdmin UserRole = "ADMIN"
	RoleUser  UserRole = "USER"
)

type User struct {
	Id       int        `json:"id"`
	Email    string     `json:"email"`
	Roles    []UserRole `json:"roles"`
	Password string     `json:"password"`
}

type UserWithoutPassword struct {
	Id    int        `json:"id"`
	Email string     `json:"email"`
	Roles []UserRole `json:"roles"`
}

type Session struct {
	UserID int `json:"userId"`
}

func RemovePassword(user User) UserWithoutPassword {
	cleanedUser := UserWithoutPassword{
		Id:    user.Id,
		Email: user.Email,
		Roles: user.Roles,
	}
	return cleanedUser
}

func findUserById(userID int) *User {

	if userID == 1 {
		return &User{
			Id:       1,
			Email:    "jonas@jospace.de",
			Password: "secret", // Normally you'd never return password in real applications.
			Roles:    []string{RoleAdmin},
		}
	}
	return nil
}

func deserialize(data []byte) (*Session, error) {
	var session Session
	err := json.Unmarshal(data, &session)
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func Serialize(obj interface{}) (string, error) {
	// Convert the object to JSON
	jsonData, err := json.Marshal(obj)
	if err != nil {
		return "", fmt.Errorf("error marshaling object: %v", err)
	}

	// Convert JSON data to base64 encoding
	base64Value := base64.StdEncoding.EncodeToString(jsonData)

	// Check if the size exceeds 4096 bytes
	if len(base64Value) > 4096 {
		return "", errors.New("cookie too large")
	}

	// Return the base64-encoded string
	return base64Value, nil
}

func Sign(value string, secret string) (string, error) {
	// Create HMAC using SHA-256
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(value))
	digest := h.Sum(nil)

	// Base64 encoding with padding (standard Base64)
	encodedSignature := base64.StdEncoding.EncodeToString(digest)

	// URL-encode the result to match your JavaScript example (percent-encoding)
	encodedSignature = url.QueryEscape(encodedSignature)

	// Return the value concatenated with the signature
	return value + "." + encodedSignature, nil
}

func unsign(cookieValue string, secret string) ([]byte, error) {
	parts := strings.Split(cookieValue, ".")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid cookie format")
	}
	signedData := parts[0]

	// Create a HMAC-SHA256 hash of the signed data using the secret
	expectedSignature, err := Sign(signedData, secret)
	if err != nil {
		return nil, err
	}

	// Compare the signature in the cookie with the expected signature
	if cookieValue != expectedSignature {
		return nil, fmt.Errorf("invalid cookie signature")
	}

	decodedData, err := base64.RawURLEncoding.DecodeString(signedData)
	if err != nil {
		return nil, err
	}
	// Base64 decode the signed data (this is the session data)

	return decodedData, nil
}

func GetUserFromSession(r *http.Request, cookieName string, cookieSecret string) (*User, error) {

	// type Cookie struct {
	// 	UserId int `json:"userId"`
	// }

	// ser, err := serialize(Cookie{UserId: 1})
	// fmt.Println(sign(ser, cookieSecret))

	// Get the session cookie
	cookie, err := r.Cookie(cookieName)
	if err != nil || cookie == nil {
		return nil, nil // No session cookie
	}

	// Unsigned session data from the cookie
	unsignedSession, err := unsign(cookie.Value, cookieSecret)
	fmt.Printf("Unsigned Session: %s, Error: %s\n", unsignedSession, err)
	if err != nil {
		return nil, nil // Invalid session cookie
	}

	session, err := deserialize(unsignedSession)
	if err != nil {
		return nil, err
	}

	user := findUserById(session.UserID)
	if user == nil {
		return nil, nil // User not found
	}

	return user, nil
}

func VerifyPassword(hashedPassword, plainPassword string) bool {
	parts := strings.Split(hashedPassword, "$")
	if len(parts) < 6 {
		return false
	}

	salt, err := base64.RawURLEncoding.DecodeString(parts[4])
	if err != nil {
		return false
	}

	hash, err := base64.RawURLEncoding.DecodeString(parts[5])
	if err != nil {
		return false
	}

	rehashed := hashPassword(plainPassword, salt)

	return bytes.Equal(hash, rehashed)
}

func hashPassword(password string, salt []byte) []byte {
	return argon2.IDKey([]byte(password), salt, 2, 1<<15, 1, 32)
}

func HashPassword(password string) string {
	salt := make([]byte, 16)
	_, err := rand.Read(salt)
	if err != nil {
		panic(err)
	}

	hash := hashPassword(password, salt)

	encodedSalt := base64.RawURLEncoding.EncodeToString(salt)
	encodedHash := base64.RawURLEncoding.EncodeToString(hash)

	return fmt.Sprintf("$argon2id$v=19$m=19456,t=2,p=1$%s$%s", encodedSalt, encodedHash)
}

func GetCookieExpiration(rememberMe bool) time.Duration {
	if rememberMe {
		return time.Hour * 24
	} else {
		return time.Hour * 24 * 7
	}
}

func GenerateAccountNumber(length int) string {
	accountId := make([]byte, length/2)
	rand.Read(accountId)
	return hex.EncodeToString(accountId)
}
