package repo

import (
	"database/sql"
	"errors"
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
)

type TldRepo struct {
	db *sqlx.DB
}

type Tld struct {
	Id          int    `json:"id" db:"id"`
	Tld         string `json:"tld" db:"tld"`
	CountryCode string `json:"countryCode" db:"countryCode"`
}

func NewTldRepository(db *sqlx.DB) *TldRepo {
	if db == nil {
		log.Fatal("Database connection is nil")
	}
	return &TldRepo{db: db}
}

func (repo *TldRepo) Get(tldID string) (Tld, error) {
	var tld Tld

	err := repo.db.Get(&tld, "SELECT id, tld, countryCode FROM tld WHERE id = ?", tldID)
	if err != nil {
		return Tld{}, fmt.Errorf("failed to execute query: %w", err)
	}

	return tld, nil
}

func (repo *TldRepo) GetByTld(tldStr string) (Tld, error) {
	var tld Tld

	err := repo.db.Get(&tld, "SELECT id, tld, countryCode FROM tld WHERE tld = ?", tldStr)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Tld{}, fmt.Errorf("No row found with this tld")
		}
		return Tld{}, fmt.Errorf("failed to execute query: %w", err)
	}

	return tld, nil
}

func (repo *TldRepo) GetTlds() ([]Tld, error) {
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
