package repo

import (
	"database/sql"
	"errors"
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
)

type CountriesRepo struct {
	db *sqlx.DB
}

type Country struct {
	Name        string `json:"name" db:"name"`
	Capital     string `json:"capital" db:"capital"`
	UnMember    bool   `json:"unMember" db:"unMember"`
	Region      string `json:"region" db:"region"`
	Subregion   string `json:"subregion" db:"subregion"`
	Cca3        string `json:"cca3" db:"cca3"`
	Cca2        string `json:"cca2" db:"cca2"`
	CallingCode string `json:"callingCode" db:"callingCode"`
}

type CountryName struct {
	Cca2 string `json:"cca2" db:"cca2"`
	Name string `json:"name" db:"name"`
}

func NewCountryRepository(db *sqlx.DB) *CountriesRepo {
	if db == nil {
		log.Fatal("Database connection is nil")
	}
	return &CountriesRepo{db: db}
}

func (repo *CountriesRepo) GetCountries() ([]Country, error) {
	var countries []Country

	err := repo.db.Select(&countries, "SELECT name, capital, unMember, region, subregion, cca3, cca2, callingCode FROM countries")
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []Country{}, nil
		}
		return []Country{}, fmt.Errorf("failed to execute query: %w", err)
	}
	return countries, nil
}

func (repo *CountriesRepo) GetCountryByCode(code string) (Country, error) {
	var country Country

	whereClause := "WHERE cca2 = ?"
	if len(code) == 3 {
		whereClause = "WHERE cca3 = ?"
	}

	err := repo.db.Get(&country, "SELECT name, capital, unMember, region, subregion, cca3, cca2, callingCode FROM countries "+whereClause, code)
	if err != nil {
		return Country{}, fmt.Errorf("failed to execute query: %w", err)
	}
	return country, nil
}

func (repo *CountriesRepo) GetCountryNames() ([]CountryName, error) {
	var countries []CountryName

	err := repo.db.Select(&countries, "SELECT name, cca2 FROM countries")
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []CountryName{}, nil
		}
		return []CountryName{}, fmt.Errorf("failed to execute query: %w", err)
	}
	return countries, nil
}

func (repo *CountriesRepo) GetRandomCountry(selectedCountries []string) (Country, error) {
	var country Country

	query, args, err := sqlx.In(`
		SELECT name, capital, unMember, region, subregion, cca3, cca2, callingCode 
		FROM countries 
		WHERE cca2 NOT IN (?) 
		ORDER BY RAND() 
		LIMIT 1`, selectedCountries)

	if err != nil {
		return Country{}, fmt.Errorf("failed to construct query: %w", err)
	}

	query = repo.db.Rebind(query)

	err = repo.db.Get(&country, query, args...)
	if err != nil {
		return Country{}, fmt.Errorf("failed to execute query: %w", err)
	}

	return country, nil
}

func (repo *CountriesRepo) GetRandomIndependentCountry(selectedCountries []string, independent bool) (Country, error) {
	var country Country

	query, args, err := sqlx.In(`
		SELECT name, capital, unMember, region, subregion, cca3, cca2, callingCode 
		FROM countries 
		WHERE cca2 NOT IN (?) AND unMember = ? 
		ORDER BY RAND() 
		LIMIT 1`, selectedCountries, independent)

	if err != nil {
		return Country{}, fmt.Errorf("failed to construct query: %w", err)
	}

	query = repo.db.Rebind(query)

	err = repo.db.Get(&country, query, args...)
	if err != nil {
		return Country{}, fmt.Errorf("failed to execute query: %w", err)
	}

	return country, nil
}
