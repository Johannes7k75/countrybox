package controller

import "country-box/internal/database/repo"

type TldController struct {
	TldRepo *repo.TldRepo
}

func NewTldController(tldRepo *repo.TldRepo) *TldController {
	return &TldController{
		TldRepo: tldRepo,
	}
}
