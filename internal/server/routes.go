package server

import (
	"country-box/internal/server/api"
	"country-box/internal/server/controller"
	"country-box/internal/server/controller/user"
	"country-box/internal/server/repo"
	"encoding/json"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func (s *Server) RegisterRoutes() http.Handler {

	s.r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://*", "http://*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	tldRepository := repo.NewTldRepository(s.db)
	userRepository := repo.NewUserRepository(s.db)
	countryRepository := repo.NewCountryRepository(s.db)
	geoJsonRepository := repo.NewGeoJsonRepository(s.db)

	tldController := controller.NewTldController(tldRepository)
	userController := user.NewUserController(userRepository)
	countryController := controller.NewCountriesController(countryRepository)
	geoJsonController := controller.NewGeoJsonController(geoJsonRepository)

	authRoute := &api.AuthHandler{
		UserController: userController,
	}

	tldRoute := &api.TldsHandler{
		TldController: tldController,
	}

	countryRoute := &api.CountriesHandler{
		ContriesController: countryController,
	}

	geoJsonRoute := &api.GeoJsonHandler{
		GeoJsonController: geoJsonController,
	}

	apiGroup := s.r.Group("/api/v3")
	{
		authRoute.AuthRoutes(apiGroup)
		tldRoute.TldRoutes(apiGroup)
		countryRoute.CountryRoutes(apiGroup)
		geoJsonRoute.GeoJsonRoutes(apiGroup)
	}

	s.r.GET("/health", s.healthHandler)

	return s.r
}

func (s *Server) healthHandler(c *gin.Context) {
	jsonResp, _ := json.Marshal(s.dbHealth())
	_, _ = c.Writer.Write(jsonResp)
}
