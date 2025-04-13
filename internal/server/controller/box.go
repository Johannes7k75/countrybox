package controller

import (
	"country-box/internal/database/repo"
	"fmt"
	"log"
)

var boxes = []int{1, 3, 7, 14, 28, 56}

type BoxController struct {
	BoxRepo *repo.BoxRepo
}

func NewBoxController(boxRepo *repo.BoxRepo) *BoxController {
	return &BoxController{
		BoxRepo: boxRepo,
	}
}

func (c *BoxController) TrainCountry(userId int, code string) error {
	log.Println("Get BoxCountry")
	boxCountry, err := c.BoxRepo.GetBoxCountryByUserIdAndCode(userId, code)
	if err != nil {
		return fmt.Errorf("Error getting country Box for user: %d and code: %s", userId, code)
	}

	log.Println(boxCountry)

	phase := boxCountry.Phase
	if phase <= len(boxes)-1 {
		phase++
	} else if phase > len(boxes) {
		phase = len(boxes) - 1
	}

	err = c.BoxRepo.UpdatePhase(userId, phase, code)
	if err != nil {
		return fmt.Errorf("Error upating phase for user: %d, code: %s, error: %s", userId, code, err)
	}

	return nil
}
