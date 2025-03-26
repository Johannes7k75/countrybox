package repo

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
)

type UserRepository struct {
	db *sqlx.DB
}

type UserRole = string

const (
	RoleAdmin UserRole = "ADMIN"
	RoleUser  UserRole = "USER"
)

type User struct {
	Id       int        `json:"id"`
	Email    string     `json:"email"`
	Roles    []UserRole `json:"roles"`
	Password string     `json:"password"`
}

type PasswordLessUser struct {
	Id    int        `json:"id"`
	Email string     `json:"email"`
	Roles []UserRole `json:"roles"`
}

func NewUserRepository(db *sqlx.DB) *UserRepository {
	if db == nil {
		log.Fatal("Database connection is nil")
	}
	return &UserRepository{db: db}
}

func (repo *UserRepository) Get(userID int) (User, error) {
	var user User
	var rolesData []byte

	err := repo.db.Get(user, "SELECT id, email, roles, password FROM users WHERE id = $1", userID)
	if err != nil {
		return User{}, fmt.Errorf("failed to execute query: %w", err)
	}

	err = json.Unmarshal(rolesData, &user.Roles)
	if err != nil {
		return User{}, fmt.Errorf("failed to unmarshal roles JSON: %w", err)
	}

	return user, nil
}

func (repo *UserRepository) GetUserByEmail(email string) (User, error) {
	var user User
	var rolesData []byte

	err := repo.db.QueryRowx("SELECT id, email, roles, password FROM users WHERE email = ?", email).
		Scan(&user.Id, &user.Email, &rolesData, &user.Password)
	if err != nil {
		return User{}, fmt.Errorf("failed to execute query: %w", err)
	}

	if len(rolesData) == 0 {
		user.Roles = []UserRole{}
	} else {
		err = json.Unmarshal(rolesData, &user.Roles)
		if err != nil {
			return User{}, fmt.Errorf("failed to unmarschal roles JSON: %w", err)
		}
	}

	return user, nil
}

func (repo *UserRepository) Delete(userID int) error {
	_, err := repo.db.Exec("DELETE FROM users WHERE id = $1", userID)
	return fmt.Errorf("failed to delete user: %w", err)
}

func (repo *UserRepository) Create(email string, password string, roles []UserRole) (int, error) {
	var userID int

	rolesJSON, err := json.Marshal(roles)
	if err != nil {
		return -1, fmt.Errorf("failed to unmarshall user roles: %w", err)
	}

	err = repo.db.QueryRow("INSERT INTO users (email, password, roles) VALUES ($1, $2, $2) RETURNING id", email, password, rolesJSON).Scan(&userID)
	if err != nil {
		return -1, fmt.Errorf("failed to create user: %w", err)
	}
	return userID, nil
}
