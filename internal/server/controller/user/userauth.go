package user

import (
	"bytes"
	"country-box/internal/database/repo"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/argon2"
)

type contextKey string

const userContextKey = contextKey("user")

var (
	cookieName   = os.Getenv("COOKIE_NAME")
	cookieSecret = os.Getenv("COOKIE_SECRET")
)

func VerifyPassword(hashedPassword, plainPassword string) bool {
	parts := strings.Split(hashedPassword, "$")
	if len(parts) < 6 {
		return false
	}

	salt := convertStringToBytes(parts[4])
	hash := convertStringToBytes(parts[5])

	rehashed := hashPassword(plainPassword, salt)

	return bytes.Equal(hash, rehashed)
}

func hashPassword(password string, salt []byte) []byte {
	return argon2.IDKey([]byte(password), salt, 2, 1<<15, 1, 32)
}

func Hashpassword(password string) string {
	salt := make([]byte, 16)
	_, err := rand.Read(salt)
	if err != nil {
		panic(err)
	}

	hash := hashPassword(password, salt)

	encodedSalt := convertBytesToString(salt)
	encodedHash := convertBytesToString(hash)

	return fmt.Sprintf("$argon2id$v=19$m=19456,t=2,p=1$%s$%s", encodedSalt, encodedHash)
}

func convertBytesToString(b []byte) string {
	return base64.RawURLEncoding.EncodeToString(b)
}

func convertStringToBytes(s string) []byte {
	b, err := base64.RawURLEncoding.DecodeString(s)
	if err != nil {
		log.Fatal(err)
	}
	return b
}

func Serialize(obj interface{}) (string, error) {
	jsonData, err := json.Marshal(obj)
	if err != nil {
		return "", fmt.Errorf("error marshaling object: %v", err)
	}
	base64Value := base64.StdEncoding.EncodeToString(jsonData)
	if len(base64Value) > 4096 {
		return "", errors.New("cookie too large")
	}
	return base64Value, nil
}

type Session struct {
	UserID int `json:"userId"`
}

func Deserialize(data []byte) (*Session, error) {
	var session Session
	if err := json.Unmarshal(data, &session); err != nil {
		return nil, err
	}
	return &session, nil
}

func GetCookieExpiration(rememberMe bool) time.Duration {
	if rememberMe {
		return time.Hour * 24
	} else {
		return time.Hour * 24 * 7
	}
}

func Sign(value, secret string) (string, error) {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(value))
	digest := h.Sum(nil)

	encodedSignature := base64.StdEncoding.EncodeToString(digest)
	encodedSignature = url.QueryEscape(encodedSignature)
	return value + "." + encodedSignature, nil
}

func Unsign(cookieValue, secret string) ([]byte, error) {
	parts := strings.Split(cookieValue, ".")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid cookie format")
	}
	signedData := parts[0]

	expectedSignature, err := Sign(signedData, secret)
	if err != nil {
		return nil, err
	}

	fmt.Println(cookieValue, expectedSignature)

	if cookieValue != expectedSignature {
		return nil, fmt.Errorf("invalid cookie signature")
	}
	decodedData := convertStringToBytes(signedData)

	return decodedData, nil
}

func (c *UserController) Login(ctx *gin.Context, user repo.User, rememberMe bool) {
	sessionData := map[string]interface{}{
		"userId": user.Id,
	}

	session, err := Serialize(sessionData)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	signedSession, err := Sign(session, cookieSecret)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sign session"})
		return
	}

	expiration := time.Now().Add(time.Duration(GetCookieExpiration(rememberMe)) * time.Second)
	secure := (ctx.GetHeader("X-Env") == "production")

	ctx.SetCookie(cookieName, signedSession, int(expiration.Unix()), "/", "", secure, true)

	ctx.JSON(http.StatusOK, c.RemovePassword(&user))
}

func (c *UserController) GetUserFromContext(ctx *gin.Context) *repo.User {
	fmt.Printf("User Context %v\n", ctx.Request.Context().Value(userContextKey))
	user, _ := ctx.Request.Context().Value(userContextKey).(*repo.User)
	return user
}

func (c *UserController) Logout(ctx *gin.Context) {
	secure := (ctx.GetHeader("X-Env") == "production")

	ctx.SetCookie(cookieName, "", 0, "/", "", secure, true)
}

func (c *UserController) GetUserFromSession(ctx *gin.Context, cookieName, cookieSecret string) (*repo.User, error) {
	cookie, err := ctx.Request.Cookie(cookieName)
	if err != nil || cookie == nil {
		return nil, nil
	}

	unsignedSession, err := Unsign(cookie.Value, cookieSecret)
	fmt.Printf("Unsigned Session: %s, Error: %s\n", &unsignedSession, err)
	if err != nil {
		return nil, nil
	}

	session, err := Deserialize(unsignedSession)
	if err != nil {
		return nil, err
	}

	user, err := c.UserRepo.Get(session.UserID)
	if err != nil {
		return nil, err
	}

	return &user, nil
}
