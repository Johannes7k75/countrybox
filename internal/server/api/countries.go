package api

import (
	"country-box/internal/server/controller"
	"country-box/internal/server/repo"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CountriesHandler struct {
	ContriesController *controller.CountriesController
}

func (h *CountriesHandler) CountryRoutes(R *gin.RouterGroup) {
	countryGroup := R.Group("/countries")
	{
		countryGroup.GET("/", h.countriesRoute)
		countryGroup.GET("/:code", h.countryRoute)
		countryGroup.GET("/names", h.countryNamesRoute)
	}

	countries, err := h.ContriesController.CountriesRepo.GetCountries()
	if err != nil {
		fmt.Println(err)
	}
	fmt.Printf("Countries: %d\n", len(countries))
}

func (h *CountriesHandler) countryRoute(c *gin.Context) {
	code := c.Param("code")
	country, err := h.ContriesController.CountriesRepo.GetCountryByCode(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	c.JSON(http.StatusOK, country)
}
func (h *CountriesHandler) countriesRoute(c *gin.Context) {
	countries, err := h.ContriesController.CountriesRepo.GetCountries()
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	if countries == nil {
		countries = []repo.Country{}
	}

	c.JSON(http.StatusOK, countries)
}

func (h *CountriesHandler) countryNamesRoute(c *gin.Context) {
	countries, err := h.ContriesController.CountriesRepo.GetCountryNames()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	if countries == nil {
		countries = []repo.CountryName{}
	}

	c.JSON(http.StatusOK, countries)
}
