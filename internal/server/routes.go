package server

import (
	"country-box/internal/server/api"
	"country-box/internal/server/controller"
	"country-box/internal/server/controller/user"
	"country-box/internal/server/repo"
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
	boxRepository := repo.NewBoxRepository(s.db)

	tldController := controller.NewTldController(tldRepository)
	userController := user.NewUserController(userRepository)
	countryController := controller.NewCountriesController(countryRepository)
	geoJsonController := controller.NewGeoJsonController(geoJsonRepository)
	boxController := controller.NewBoxController(boxRepository)

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

	boxRoute := &api.BoxHandler{
		BoxController: boxController,
		AuthHandler:   authRoute,
	}

	apiGroup := s.r.Group("/api/v3")
	{
		authRoute.AuthRoutes(apiGroup)
		tldRoute.TldRoutes(apiGroup)
		countryRoute.CountryRoutes(apiGroup)
		geoJsonRoute.GeoJsonRoutes(apiGroup)
		boxRoute.BoxRoutes(apiGroup)
	}

	s.r.GET("/health", s.healthHandler)

	return s.r
}

func (s *Server) healthHandler(c *gin.Context) {
	dbHealth := s.dbHealth()
	c.JSON(http.StatusOK, dbHealth)
}
