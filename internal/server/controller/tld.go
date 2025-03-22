package controller

import "country-box/internal/server/repo"

type TldController struct {
	TldRepo *repo.TldRepository
}

func NewTldController(tldRepo *repo.TldRepository) *TldController {
	return &TldController{
		TldRepo: tldRepo,
	}
}
