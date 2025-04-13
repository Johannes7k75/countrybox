package controller

import "country-box/internal/server/repo"

type SettingsController struct {
	SettingsRepo *repo.SettingsRepository
}

func NewSettingsController(settingsRepo *repo.SettingsRepository) *SettingsController {
	return &SettingsController{
		SettingsRepo: settingsRepo,
	}
}
