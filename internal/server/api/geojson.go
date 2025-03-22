package api

import (
	"country-box/internal/server/controller"
	"net/http"

	"github.com/gin-gonic/gin"
)

type GeoJsonHandler struct {
	GeoJsonController *controller.GeoJsonController
}

func (h *GeoJsonHandler) GeoJsonRoutes(R *gin.RouterGroup) {
	geoJsonGroup := R.Group("/geojson")
	{
		geoJsonGroup.GET("/:code", h.GetGeoJsonByCode)
	}
}

func (h *GeoJsonHandler) GetGeoJsonByCode(c *gin.Context) {
	code := c.Param("code")
	geoJson, err := h.GeoJsonController.GeoJsonRepo.GetGeoJsonByCode(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	c.JSON(http.StatusOK, geoJson)
}
