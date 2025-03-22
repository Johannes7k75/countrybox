package api

import (
	"country-box/internal/server/controller"
	"country-box/internal/server/repo"
	"net/http"

	"github.com/gin-gonic/gin"
)

type TldsHandler struct {
	TldController *controller.TldController
}

func (h *TldsHandler) TldRoutes(R *gin.RouterGroup) {
	tldGroup := R.Group("/tlds")
	{
		tldGroup.GET("/", h.TldsRoute)
		tldGroup.GET("/:tld", h.TldRoute)
	}
}

func (h *TldsHandler) TldRoute(c *gin.Context) {
	tld := c.Param("tld")
	tldData, err := h.TldController.TldRepo.GetByTld(tld)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	c.JSON(http.StatusOK, tldData)
}
func (h *TldsHandler) TldsRoute(c *gin.Context) {
	tlds, err := h.TldController.TldRepo.GetTlds()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	if tlds == nil {
		tlds = []repo.Tld{}
	}

	c.JSON(http.StatusOK, tlds)
}
