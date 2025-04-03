package api

import (
	"country-box/internal/server/controller"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type GameHandler struct {
	GameController *controller.GameController
}

func (h *GameHandler) GameRoutes(R *gin.RouterGroup) {
	gameGroup := R.Group("/game")
	{
		gameGroup.GET("/options", h.gameRoute)
	}
}

func (h *GameHandler) gameRoute(c *gin.Context) {
	countStr := c.Query("count")
	independent := c.Query("independent") == "true"
	log.Println(independent)
	count := 4

	if countStr != "" {
		if parsedCount, err := strconv.Atoi(countStr); err == nil {
			count = parsedCount
		}
	}

	fmt.Println(countStr)

	c.JSON(http.StatusOK, h.GameController.GetIndependentOptions(count, independent))
}
