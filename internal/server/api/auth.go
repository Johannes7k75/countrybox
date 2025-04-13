package api

import (
	"country-box/internal/server/controller/user"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	UserController *user.UserController
}

type contextKey string

const userContextKey = contextKey("user")

var (
	cookieName   = os.Getenv("COOKIE_NAME")
	cookieSecret = os.Getenv("COOKIE_SECRET")
)

func (h *AuthHandler) AuthRoutes(R *gin.RouterGroup) {
	authGroup := R.Group("/auth")
	{
		authGroup.GET("/me", h.UserAuthMiddleware, h.meHandler)
		authGroup.GET("/accountId", h.accountIdHandler)

		authGroup.POST("/login", h.loginHandler)
		authGroup.POST("/logout", h.logoutHandler)
		authGroup.POST("/signup", h.signupHandler)
	}
}

func (h *AuthHandler) UserAuthMiddleware(c *gin.Context) {
	log.Println("User Auth Handler")
	user, err := h.UserController.GetUserFromSession(c, cookieName, cookieSecret)

	if user == nil && err == nil {
		http.Error(c.Writer, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err != nil {
		http.Error(c.Writer, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	c.Set(string(userContextKey), user)

	c.Next()
}

func (h *AuthHandler) meHandler(c *gin.Context) {
	userWithPassword := h.UserController.GetUserFromContext(c)

	var response struct {
		User interface{} `json:"user"`
	}

	if userWithPassword == nil {
		response.User = nil
	} else {
		response.User = h.UserController.RemovePassword(userWithPassword)
	}

	c.JSON(http.StatusOK, response)
}

func (h *AuthHandler) accountIdHandler(c *gin.Context) {
	c.String(http.StatusOK, h.UserController.GenerateAccountNumber(16))
}

func (h *AuthHandler) loginHandler(c *gin.Context) {
	var body struct {
		Email      string `json:"email"`
		Password   string `json:"password"`
		RememberMe bool   `json:"rememberMe"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	if body.Email == "" || body.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email and password are required"})
		return
	}

	passwordUser, err := h.UserController.UserRepo.GetUserByEmail(body.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Bad credentials", "debug": fmt.Sprintf("Getting user: %s", err)})
		return
	}

	if !user.VerifyPassword(passwordUser.Password, body.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Bad credentials", "debug": "Verify password"})
		return
	}

	h.UserController.Login(c, passwordUser, body.RememberMe)
}

func (h *AuthHandler) logoutHandler(c *gin.Context) {
	h.UserController.Logout(c)

	response := map[string]interface{}{
		"user": nil,
	}

	c.JSON(http.StatusOK, response)
}

func (h *AuthHandler) signupHandler(c *gin.Context) {
	var body struct {
		Email      string `json:"email"`
		Password   string `json:"password"`
		RememberMe bool   `json:"rememberMe"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	if body.Email == "" || body.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email and password are required"})
		return
	}

	userID, err := h.UserController.CreateUser(body.Email, body.Password)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already used"})
		return
	}

	passwordUser, err := h.UserController.UserRepo.Get(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create or find user"})
	}

	h.UserController.Login(c, passwordUser, body.RememberMe)
}
