package database

import (
	"country-box/internal/server/controller/user"
	"embed"
	"encoding/json"
	"log"
	"path/filepath"
	"strings"

	"github.com/jmoiron/sqlx"
)

type Seeder struct {
	db *sqlx.DB
}

//go:embed data/countries.json
var countriesJSON []byte

//go:embed data/geojson/*.json
var geoJsonFiles embed.FS

func (seeder *Seeder) seedDatabase() {
	log.Println("Seeding database...")

	if _, err := seeder.db.Exec("SET FOREIGN_KEY_CHECKS = 0;"); err != nil {
		log.Printf("Failed to disable Foreign key check: %v", err)
	}

	seeder.seedUsers()
	seeder.SeedCountries()
	seeder.SeedTlds()
	seeder.SeedGeoJson()

	if _, err := seeder.db.Exec("SET FOREIGN_KEY_CHECKS = 1;"); err != nil {
		log.Printf("Failed to enable Foreign key check: %v", err)
	}
}

func (seeder *Seeder) seedUsers() {
	log.Println("Seeding users...")
	email := "jonas@jospace.de"
	password := user.Hashpassword("TestPassword")

	if _, err := seeder.db.Exec("DELETE FROM users"); err != nil {
		log.Println("Failed to clear users:", err)
		return
	}
	if _, err := seeder.db.Exec("DELETE FROM settings"); err != nil {
		log.Println("Failed to clear settings:", err)
		return
	}

	query := `INSERT INTO users (email, password) VALUES (?, ?)`
	res, err := seeder.db.Exec(query, email, password)
	if err != nil {
		log.Println("Failed to seed users:", err)
		return
	}

	phasesJSON, err := json.Marshal([]int{1, 3, 5, 7, 14})
	if err != nil {
		log.Println("Failed to marshal phases JSON:", err)
		return
	}

	userId, err := res.LastInsertId()
	if err != nil {
		log.Println("Failed to get last insert id:", err)
		return
	}

	query = `INSERT INTO settings (user, phases) VALUES (?, ?)`
	if _, err := seeder.db.Exec(query, userId, phasesJSON); err != nil {
		log.Println("Failed to seed settings for user 0:", err)
		return
	}

	log.Println("Successfully completed seeding users")
}

type Country struct {
	Name        string   `json:"name"`
	Cca3        string   `json:"cca3"`
	Cca2        string   `json:"cca2"`
	Capital     string   `json:"capital"`
	Independent bool     `json:"independent"`
	Region      string   `json:"region"`
	Subregion   string   `json:"subregion"`
	CallingCode string   `json:"callingCode"`
	UnMember    bool     `json:"unMember"`
	Tlds        []string `json:"tlds"`
}

func (seeder *Seeder) SeedCountries() {
	log.Println("Seeding countries...")

	var countries []Country

	if _, err := seeder.db.Exec("DELETE FROM countries"); err != nil {
		log.Println("Failed to clear countries:", err)
		return
	}

	if err := json.Unmarshal(countriesJSON, &countries); err != nil {
		log.Printf("Failed to unmarshall countries.json: %v", err)
		return
	}

	query := `INSERT INTO countries (name, capital, unMember, region, subregion, cca3, cca2, callingCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`

	for _, country := range countries {
		if _, err := seeder.db.Exec(query, country.Name, country.Capital, country.UnMember, country.Region, country.Subregion, strings.ToLower(country.Cca3), strings.ToLower(country.Cca2), country.CallingCode); err != nil {
			log.Printf("Failed to seed geoJson: %v", err)
			return
		}
	}

	log.Println("Successfully completed seeding countries")
}

func (seeder *Seeder) SeedTlds() {
	log.Println("Seeding tlds...")

	var countries []Country

	if _, err := seeder.db.Exec("DELETE FROM tld"); err != nil {
		log.Println("Failed to clear countries:", err)
		return
	}

	if err := json.Unmarshal(countriesJSON, &countries); err != nil {
		log.Printf("Failed to unmarshall countries.json: %v", err)
		return
	}

	query := `INSERT INTO tld (tld, countryCode) VALUES (?, ?)`

	for _, country := range countries {
		for _, tld := range country.Tlds {
			cleanedUrl, _ := strings.CutPrefix(tld, ".")

			if _, err := seeder.db.Exec(query, strings.ToLower(cleanedUrl), country.Cca2); err != nil {
				log.Printf("Failed to seed tld: %v", err)
				return
			}
		}
	}

	log.Println("Successfully completed seeding tlds")
}

func (seeder *Seeder) SeedGeoJson() {
	log.Println("Seeding geoJson...")

	geoJson := loadGeoJson()

	if _, err := seeder.db.Exec("DELETE FROM geoJson"); err != nil {
		log.Println("Failed to clear geoJson:", err)
		return
	}

	for file, content := range geoJson {
		name := strings.ToLower(strings.Split(filepath.Base(file), ".")[0])
		if len(name) > 2 {
			continue
		}

		if _, err := seeder.db.Exec("INSERT INTO geoJson (countryCode, geoJson) VALUES (?, ?)", name, content); err != nil {
			log.Printf("Failed to seed geoJson: %v", err)
			return
		}

	}

	log.Println("Successfully completed seeding geoJson")
}

func loadGeoJson() map[string][]byte {
	geoJSONMap := make(map[string][]byte)

	entries, err := geoJsonFiles.ReadDir("data/geojson")
	if err != nil {
		log.Printf("Error reading geoJson dir: %v", err)
		return geoJSONMap
	}

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}

		content, err := geoJsonFiles.ReadFile("data/geojson/" + entry.Name())
		if err != nil {
			log.Printf("Error reading geoJson file %s: %v", entry.Name(), err)
			continue
		}

		geoJSONMap[entry.Name()] = content
	}

	return geoJSONMap
}
