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

type MappedBoxes struct {
	Id        int      `json:"id"`
	Phase     int      `json:"phase"`
	Countries []string `json:"countries"`
}

func (c *BoxController) MapBoxes(boxes []repo.CountryBox) []MappedBoxes {

	phaseMap := make(map[int][]string)
	var mappedBoxes []MappedBoxes

	for _, box := range boxes {
		if _, exists := phaseMap[box.Phase]; !exists {
			phaseMap[box.Phase] = []string{}
		}

		phaseMap[box.Phase] = append(phaseMap[box.Phase], box.CountryCode)
	}

	for phase, countries := range phaseMap {
		mappedBoxes = append(mappedBoxes, MappedBoxes{
			Id:        phase,
			Phase:     phase,
			Countries: countries,
		})
	}

	return mappedBoxes
}
