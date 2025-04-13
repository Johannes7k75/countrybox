package api

import (
	"country-box/internal/database/repo"
	"country-box/internal/server/controller"
	"log"
	"net/http"
	"strings"

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

	cleanedTld := tld
	if !strings.HasPrefix(tld, ".") {
		cleanedTld, _ = strings.CutPrefix(tld, ".")
	}

	log.Println(tld, cleanedTld)

	tldData, err := h.TldController.TldRepo.GetByTld(cleanedTld)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
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
