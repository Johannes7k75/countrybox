package repo

import (
	"database/sql"
	"errors"
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
)

type TldRepository struct {
	db *sqlx.DB
}

type Tld struct {
	Id          int    `json:"id" db:"id"`
	Tld         string `json:"tld" db:"tld"`
	CountryCode string `json:"countryCode" db:"countryCode"`
}

func NewTldRepository(db *sqlx.DB) *TldRepository {
	if db == nil {
		log.Fatal("Database connection is nil")
	}
	return &TldRepository{db: db}
}

func (repo *TldRepository) Get(tldID string) (Tld, error) {
	var tld Tld

	err := repo.db.Get(tld, "SELECT id, tld, countryCode FROM tld WHERE id = $1", tldID)
	if err != nil {
		return Tld{}, fmt.Errorf("failed to execute query: %w", err)
	}

	return tld, nil
}

func (repo *TldRepository) GetByTld(tldStr string) (Tld, error) {
	var tld Tld

	err := repo.db.Get(tld, "SELECT id, tld, countryCode FROM tld WHERE tld = $1", tldStr)
	if err != nil {
		return Tld{}, fmt.Errorf("failed to execute query: %w", err)
	}

	return tld, nil
}

func (repo *TldRepository) GetTlds() ([]Tld, error) {
	var tlds []Tld

	err := repo.db.Select(&tlds, "SELECT id, tld, countryCode FROM tld")
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []Tld{}, nil // No results, return empty slice but no error
		}
		return []Tld{}, fmt.Errorf("failed to execute query: %w", err)
	}

	return tlds, nil
}
