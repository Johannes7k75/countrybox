package server

import (
	"country-box/internal/server/routes"
	"country-box/internal/server/utils"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func (s *Server) RegisterRoutes() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Route("/api/v3", func(r chi.Router) {
		r.Route("/tlds", func(r chi.Router) {
			r.Get("/", s.tldsHandler)
			r.Get("/{tld}", s.tldHandler)

		})

		r.Route("/countries", func(r chi.Router) {
			r.Get("/", s.countriesHandler)
			r.Get("/{code}", s.countryHandler)
			r.Get("/names", s.countryNamesHandler)
		})

		r.Route("/geojson", func(r chi.Router) {
			r.Get("/{code}", s.geoJsonHandler)
		})

		r.Mount("/auth", routes.AuthRoutes(s.db))
	})

	r.Get("/", s.HelloWorldHandler)

	r.Get("/health", s.healthHandler)

	return r
}

func (s *Server) HelloWorldHandler(w http.ResponseWriter, r *http.Request) {
	resp := make(map[string]string)
	resp["message"] = "Hello World"

	jsonResp, err := json.Marshal(resp)
	if err != nil {
		log.Fatalf("error handling JSON marshal. Err: %v", err)
	}

	_, _ = w.Write(jsonResp)
}

func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	jsonResp, _ := json.Marshal(s.db.Health())
	_, _ = w.Write(jsonResp)
}

func (s *Server) tldsHandler(w http.ResponseWriter, r *http.Request) {
	resp, err := s.db.GetTlds()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching TLDs: %v", err), http.StatusInternalServerError)
		return
	}
	utils.WriteJSONResponse(w, resp, http.StatusOK)
}

func (s *Server) tldHandler(w http.ResponseWriter, r *http.Request) {
	tld := chi.URLParam(r, "tld")
	resp, err := s.db.GetTld(tld)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching TLD: %v", err), http.StatusInternalServerError)
		return
	}
	utils.WriteJSONResponse(w, resp, http.StatusOK)
}

func (s *Server) countriesHandler(w http.ResponseWriter, r *http.Request) {
	resp, err := s.db.GetCountries()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching Countries: %v", err), http.StatusInternalServerError)
		return
	}
	utils.WriteJSONResponse(w, resp, http.StatusOK)
}

func (s *Server) countryHandler(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	resp, err := s.db.GetCountry(code)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching Country: %v", err), http.StatusInternalServerError)
		return
	}
	utils.WriteJSONResponse(w, resp, http.StatusOK)
}

func (s *Server) countryNamesHandler(w http.ResponseWriter, r *http.Request) {
	resp, err := s.db.GetCountryNames()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching Country names: %v", err), http.StatusInternalServerError)
		return
	}
	utils.WriteJSONResponse(w, resp, http.StatusOK)
}

func (s *Server) geoJsonHandler(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	resp, err := s.db.GetGeoJson(code)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching GeoJson: %v", err), http.StatusInternalServerError)
		return
	}
	utils.WriteJSONResponse(w, resp, http.StatusOK)
}
