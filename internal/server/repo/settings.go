package repo

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
)

type SettingsRepository struct {
	db *sqlx.DB
}

type Setting struct {
	Id     int             `json:"id" db:"id"`
	Phases json.RawMessage `json:"phases" db:"phases"`
	User   int             `json:"userId" db:"user"`
}

func NewSettingsRepository(db *sqlx.DB) *SettingsRepository {
	if db == nil {
		log.Fatal("Database connection is nil")
	}
	return &SettingsRepository{db: db}
}

func (repo *SettingsRepository) GetSettingByID(id int) (Setting, error) {
	var setting Setting
	err := repo.db.Get(&setting, "SELECT id, phases, user FROM settings WHERE id = ?", id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Setting{}, nil
		}
		return Setting{}, fmt.Errorf("failed to get setting by ID: %w", err)
	}
	return setting, nil
}

func (repo *SettingsRepository) GetSettingByUserID(userID int) (Setting, error) {
	var setting Setting
	err := repo.db.Get(&setting, "SELECT id, phases, user FROM settings WHERE user = ?", userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Setting{}, nil
		}
		return Setting{}, fmt.Errorf("failed to get setting by user ID: %w", err)
	}
	return setting, nil
}

func (repo *SettingsRepository) Create(userID int) (int, error) {
	return repo.CreateWithPhases(userID, []int{1, 3, 7, 5, 14})
}
func (repo *SettingsRepository) CreateWithPhases(userID int, phases []int) (int, error) {
	var settingsId int

	err := repo.db.QueryRow("INSERT INTO settings (user, phases) VALUES (?, ?) RETURNING id", userID, phases).Scan(&settingsId)
	if err != nil {
		return -1, fmt.Errorf("failed to create setting: %w", err)
	}

	return settingsId, nil
}
