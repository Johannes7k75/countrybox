package controller

import (
	"country-box/internal/server/repo"
	"log"
)

type GameController struct {
	CountriesRepo *repo.CountriesRepo
	TldRepo       *repo.TldRepository
}

func NewGameController(countriesRepo *repo.CountriesRepo, tldRepo *repo.TldRepository) *GameController {
	return &GameController{
		CountriesRepo: countriesRepo,
		TldRepo:       tldRepo,
	}
}

type CountriesWithTld struct {
	repo.Country
	Tld string `json:"tld"`
}

func (c *GameController) GetIndependentOptions(options int, independent bool) []CountriesWithTld {
	var countries []repo.Country

	for i := 0; i < options; i++ {
		selectedCountries := getCca2s(countries)
		if len(selectedCountries) == 0 {
			selectedCountries = append(selectedCountries, "''")
		}

		var country repo.Country
		var err error

		if independent {
			country, err = c.CountriesRepo.GetRandomIndependentCountry(selectedCountries, independent)
		} else {
			country, err = c.CountriesRepo.GetRandomCountry(selectedCountries)
		}

		if err != nil {
			log.Printf("Error retrieving country: %v\n", err)
			continue // Skip appending an invalid country
		}

		countries = append(countries, country)
	}

	var countriesWithTld []CountriesWithTld
	for _, country := range countries {
		tldValue := ""
		tld, err := c.TldRepo.GetByTld(country.Cca2)
		if err == nil {
			tldValue = tld.Tld
		}

		tldCountry := CountriesWithTld{
			Country: country,
			Tld:     tldValue,
		}

		countriesWithTld = append(countriesWithTld, tldCountry)
	}

	return countriesWithTld
}

func (c *GameController) GetOptions(options int) []CountriesWithTld {
	return c.GetIndependentOptions(options, true)
}

func getCca2s(countries []repo.Country) []string {
	var cca2s []string
	for _, country := range countries {
		cca2s = append(cca2s, country.Cca2)
	}

	return cca2s
}
