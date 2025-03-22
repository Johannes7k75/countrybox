package controller

import "country-box/internal/server/repo"

type CountriesController struct {
	CountriesRepo *repo.CountriesRepo
}

func NewCountriesController(countriesRepo *repo.CountriesRepo) *CountriesController {
	return &CountriesController{
		CountriesRepo: countriesRepo,
	}
}
