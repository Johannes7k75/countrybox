package middlewares

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"country-box/internal/server/utils"
)

type contextKey string

const userContextKey = contextKey("user")

var (
	cookieName   = os.Getenv("COOKIE_NAME")
	cookieSecret = os.Getenv("COOKIE_SECRET")
)

// Middleware to attach the user to the request context
func UserAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// Get the user from the session cookie
		user, err := utils.GetUserFromSession(r, cookieName, cookieSecret)
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		// Attach the user to the context
		ctx := context.WithValue(r.Context(), userContextKey, user)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}

func GetUserFromContext(r *http.Request) *utils.User {
	fmt.Printf("User Context %s\n", r.Context().Value(userContextKey)) // Debugging line
	user, _ := r.Context().Value(userContextKey).(*utils.User)
	return user
}
