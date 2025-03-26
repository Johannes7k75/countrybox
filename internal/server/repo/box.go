package repo

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/jmoiron/sqlx"
)

type BoxRepo struct {
	db *sqlx.DB
}

type CountryBox struct {
	Id          int       `json:"id" db:"id"`
	UserID      int       `json:"userId" db:"userId"`
	CountryCode string    `json:"countryCode" db:"countryCode"`
	TrainedAt   time.Time `json:"trainedAt" db:"trainedAt"`
	Phase       int       `json:"phase" db:"phase"`
}

func NewBoxRepository(db *sqlx.DB) *BoxRepo {
	if db == nil {
		log.Fatal("Database connection is nil")
	}
	return &BoxRepo{db: db}
}

func (repo *BoxRepo) GetBoxes() ([]CountryBox, error) {
	var boxes []CountryBox

	err := repo.db.Select(&boxes, "SELECT id, userId, countryCode, trainedAt, phase FROM boxes")
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []CountryBox{}, nil
		}
		return []CountryBox{}, fmt.Errorf("failed to execute query: %w", err)
	}
	return boxes, nil
}

func (repo *BoxRepo) GetBoxesByUserId(userID int) ([]CountryBox, error) {
	var boxes []CountryBox

	err := repo.db.Select(&boxes, "SELECT id, userId, countryCode, trainedAt, phase FROM boxes WHERE userId = $1", userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []CountryBox{}, nil
		}
		return []CountryBox{}, fmt.Errorf("failed to execute query: %w", err)
	}
	return boxes, nil
}

func (repo *BoxRepo) GetBoxCountryByUserIdAndCode(userId int, code string) (CountryBox, error) {
	var box CountryBox

	err := repo.db.Select(&box, "SELECT id, userId, countryCode, trainedAt, phase FROM boxes WHERE userId = $1 AND countryCode = $2", userId, code)
	if err != nil {
		return CountryBox{}, fmt.Errorf("failed to execute query: %w", err)
	}
	return box, nil
}

func (repo *BoxRepo) Create(userId int, countryCode string, trainedAt time.Time, phase int) (int, error) {
	var countryBoxId int

	err := repo.db.QueryRow("INSERT INTO boxes (userId, countryCode, trainedAt, phase) VALUES (?, ?, ?, ?) RETURNING id", userId, countryCode, trainedAt, phase).Scan(&countryBoxId)
	if err != nil {
		return -1, fmt.Errorf("failed to create box: %w", err)
	}
	return countryBoxId, nil
}

func (repo *BoxRepo) UpdatePhase(userId, newPhase int, countryCode string) error {
	_, err := repo.db.Query("UPDATE boxes SET phase = ?, trainedAt = ? WHERE userId ? AND countryCode ?", newPhase, time.Now(), userId, countryCode)
	if err != nil {
		return fmt.Errorf("failed to update boxes: %w", err)
	}

	return nil
}
