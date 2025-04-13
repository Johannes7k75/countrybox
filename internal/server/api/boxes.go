package api

import (
	"country-box/internal/server/controller"
	"country-box/internal/server/repo"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type BoxHandler struct {
	BoxController      *controller.BoxController
	SettingsController *controller.SettingsController
	AuthHandler        *AuthHandler
}

func (h *BoxHandler) BoxRoutes(R *gin.RouterGroup) {
	boxGroup := R.Group("/boxes")
	{
		boxGroup.GET("/", h.AuthHandler.UserAuthMiddleware, h.boxRoutes)
		boxGroup.GET("/:code", h.AuthHandler.UserAuthMiddleware, h.boxRoute)

		boxGroup.POST("/:code/train", h.AuthHandler.UserAuthMiddleware, h.trainCountryRoute)
	}
}

func (h *BoxHandler) boxRoutes(c *gin.Context) {
	userWithPassword := h.AuthHandler.UserController.GetUserFromContext(c)

	var response struct {
		Boxes  []repo.CountryBox `json:"boxes"`
		Phases []int             `json:"phases"`
	}

	settings, err := h.SettingsController.SettingsRepo.GetSettingByUserID(userWithPassword.Id)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not get settings for user"})
		return
	}

	err = json.Unmarshal(settings.Phases, &response.Phases)
	if err != nil {
		log.Println(err)
		return
	}

	boxes, err := h.BoxController.BoxRepo.GetBoxesByUserId(userWithPassword.Id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	response.Boxes = boxes

	c.JSON(http.StatusOK, response)
}

func (h *BoxHandler) boxRoute(c *gin.Context) {
	userWithPassword := h.AuthHandler.UserController.GetUserFromContext(c)

	code := c.Param("code")

	boxe, err := h.BoxController.BoxRepo.GetBoxCountryByUserIdAndCode(userWithPassword.Id, code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	c.JSON(http.StatusOK, boxe)
}

func (h *BoxHandler) trainCountryRoute(c *gin.Context) {
	user := h.AuthHandler.UserController.GetUserFromContext(c)
	code := c.Param("code")

	fmt.Println(user.Id, code)
	err := h.BoxController.TrainCountry(user.Id, code)
	if err != nil {
		log.Println(err)
	}

	h.boxRoutes(c)
}
