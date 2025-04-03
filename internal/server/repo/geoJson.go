package repo

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
)

type GeoJsonRepo struct {
	db *sqlx.DB
}

type GeoJson struct {
	CountryCode string          `json:"countryCode" db:"countryCode"`
	GeoJson     json.RawMessage `json:"geoJson" db:"geoJson"`
}

func NewGeoJsonRepository(db *sqlx.DB) *GeoJsonRepo {
	if db == nil {
		log.Fatal("Database connection is nil")
	}
	return &GeoJsonRepo{db: db}
}

func (repo *GeoJsonRepo) GetGeoJsonByCode(code string) (GeoJson, error) {
	var geoJson GeoJson

	err := repo.db.Select(&geoJson, "SELECT countryCode, geoJson FROM geoJson WHERE countryCode = ?", code)
	if err != nil {
		return GeoJson{}, fmt.Errorf("failed to execute query: %w", err)
	}
	return geoJson, nil
}
