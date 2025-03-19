package routes

import (
	"country-box/internal/database"
	"country-box/internal/server/middlewares"
	"country-box/internal/server/utils"
	"fmt"

	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
)

var (
	cookieName   = os.Getenv("COOKIE_NAME")
	cookieSecret = os.Getenv("COOKIE_SECRET")
)

func AuthRoutes(db database.Service) chi.Router {
	r := chi.NewRouter()

	// Apply the UserAuthMiddleware to the /me route
	r.With(middlewares.UserAuthMiddleware).Get("/me", meHandler)

	// Other routes like /login, /logout can be added similarly
	r.Post("/login", loginHandler(db))
	r.Post("/logout", logoutHandler)

	return r
}

func meHandler(w http.ResponseWriter, r *http.Request) {
	// Get the user from the request context
	userWithPassword := middlewares.GetUserFromContext(r)

	var response struct {
		User interface{} `json:"user"`
	}

	if userWithPassword == nil {
		response.User = nil
	} else {
		response.User = utils.RemovePassword(*userWithPassword)
	}

	// Set the content type and respond with JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(response)
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	secure := (r.Header.Get("X-Env") == "producation")

	http.SetCookie(w, &http.Cookie{
		Name:     cookieName,
		Value:    "",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
		Secure:   secure,
	})

	response := map[string]interface{}{
		"user": nil,
	}

	utils.WriteJSONResponse(w, response, http.StatusOK)
}

func loginHandler(db database.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Email      string `json:"email"`
			Password   string `json:"password"`
			RememberMe bool   `json:"rememberMe"`
		}

		fmt.Println(utils.HashPassword(body.Password))

		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if body.Email == "" || body.Password == "" {
			http.Error(w, "Email and password are required", http.StatusBadRequest)
			return
		}

		user, err := db.GetUserByEmail(body.Email)
		fmt.Println(body.Email, err)
		if err != nil {
			http.Error(w, "Bad credentials", http.StatusUnauthorized)
			return
		}

		if !utils.VerifyPassword(user.Password, body.Password) {
			http.Error(w, "Bad credentials", http.StatusUnauthorized)
			return
		}

		sessionData := map[string]interface{}{
			"userId": user.Id,
		}
		session, err := utils.Serialize(sessionData)
		if err != nil {
			http.Error(w, "Failed to create session", http.StatusInternalServerError)
			return
		}

		signedSession, err := utils.Sign(session, cookieSecret)
		if err != nil {
			http.Error(w, "Failed to sign session", http.StatusInternalServerError)
			return
		}

		expiration := time.Now().Add(time.Duration(utils.GetCookieExpiration(body.RememberMe)) * time.Second)
		secure := (r.Header.Get("X-Env") == "production")

		http.SetCookie(w, &http.Cookie{
			Name:     cookieName,
			Value:    signedSession,
			Expires:  expiration,
			HttpOnly: true,
			Path:     "/",
			SameSite: http.SameSiteStrictMode,
			Secure:   secure,
		})

		// Remove password before sending response
		userResponse := utils.RemovePassword(user)

		// Send response
		utils.WriteJSONResponse(w, map[string]interface{}{
			"user": userResponse,
		}, http.StatusOK)
	}
}
