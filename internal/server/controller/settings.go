package controller

import (
	"country-box/internal/database/repo"
)

type SettingsController struct {
	SettingsRepo *repo.SettingsRepo
}

func NewSettingsController(settingsRepo *repo.SettingsRepo) *SettingsController {
	return &SettingsController{
		SettingsRepo: settingsRepo,
	}
}
