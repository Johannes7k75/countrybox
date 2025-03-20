package database

import (
	"context"
	"country-box/internal/server/utils"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/joho/godotenv/autoload"
)

// Service represents a service that interacts with a database.
type Service interface {
	// Health returns a map of health status information.
	// The keys and values in the map are service-specific.
	Health() map[string]string

	// Close terminates the database connection.
	// It returns an error if the connection cannot be closed.
	Close() error

	GetTlds() ([]Tld, error)
	GetTld(tldQuery string) (Tld, error)

	GetCountries() ([]Country, error)
	GetCountry(code string) (Country, error)
	GetCountryNames() ([]CountryName, error)

	GetGeoJson(code string) (json.RawMessage, error)

	GetUser(userId int) (User, error)
	GetUserByEmail(email string) (User, error)
	CreateUser(email, password string) (User, error)
}

type service struct {
	db *sqlx.DB
}

var (
	dbname     = os.Getenv("BLUEPRINT_DB_DATABASE")
	password   = os.Getenv("BLUEPRINT_DB_PASSWORD")
	username   = os.Getenv("BLUEPRINT_DB_USERNAME")
	port       = os.Getenv("BLUEPRINT_DB_PORT")
	host       = os.Getenv("BLUEPRINT_DB_HOST")
	dbInstance *service
)

func New() Service {
	// Reuse Connection
	if dbInstance != nil {
		return dbInstance
	}

	// Opening a driver typically will not attempt to connect to the database.
	db, err := sqlx.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", username, password, host, port, dbname))
	if err != nil {
		// This will not be a connection error, but a DSN parse error or
		// another initialization error.
		log.Fatal(err)
	}
	db.SetConnMaxLifetime(0)
	db.SetMaxIdleConns(50)
	db.SetMaxOpenConns(50)

	dbInstance = &service{
		db: db,
	}
	return dbInstance
}

// Health checks the health of the database connection by pinging the database.
// It returns a map with keys indicating various health statistics.
func (s *service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	stats := make(map[string]string)

	// Ping the database
	err := s.db.PingContext(ctx)
	if err != nil {
		stats["status"] = "down"
		stats["error"] = fmt.Sprintf("db down: %v", err)
		log.Fatalf("db down: %v", err) // Log the error and terminate the program
		return stats
	}

	// Database is up, add more statistics
	stats["status"] = "up"
	stats["message"] = "It's healthy"

	// Get database stats (like open connections, in use, idle, etc.)
	dbStats := s.db.Stats()
	stats["open_connections"] = strconv.Itoa(dbStats.OpenConnections)
	stats["in_use"] = strconv.Itoa(dbStats.InUse)
	stats["idle"] = strconv.Itoa(dbStats.Idle)
	stats["wait_count"] = strconv.FormatInt(dbStats.WaitCount, 10)
	stats["wait_duration"] = dbStats.WaitDuration.String()
	stats["max_idle_closed"] = strconv.FormatInt(dbStats.MaxIdleClosed, 10)
	stats["max_lifetime_closed"] = strconv.FormatInt(dbStats.MaxLifetimeClosed, 10)

	// Evaluate stats to provide a health message
	if dbStats.OpenConnections > 40 { // Assuming 50 is the max for this example
		stats["message"] = "The database is experiencing heavy load."
	}
	if dbStats.WaitCount > 1000 {
		stats["message"] = "The database has a high number of wait events, indicating potential bottlenecks."
	}

	if dbStats.MaxIdleClosed > int64(dbStats.OpenConnections)/2 {
		stats["message"] = "Many idle connections are being closed, consider revising the connection pool settings."
	}

	if dbStats.MaxLifetimeClosed > int64(dbStats.OpenConnections)/2 {
		stats["message"] = "Many connections are being closed due to max lifetime, consider increasing max lifetime or revising the connection usage pattern."
	}

	return stats
}

// Close closes the database connection.
// It logs a message indicating the disconnection from the specific database.
// If the connection is successfully closed, it returns nil.
// If an error occurs while closing the connection, it returns the error.
func (s *service) Close() error {
	log.Printf("Disconnected from database: %s", dbname)
	return s.db.Close()
}

type Tld struct {
	Id   int    `json:"id" db:"id"`
	Tld  string `json:"tld" db:"tld"`
	Code string `json:"code" db:"countryCode"`
}

func (s *service) GetTlds() ([]Tld, error) {
	query := "SELECT * FROM tld"

	tlds := []Tld{}
	err := s.db.Select(&tlds, query)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %w", err)
	}

	return tlds, nil
}

func (s *service) GetTld(tldQuery string) (Tld, error) {
	query := "SELECT * FROM tld WHERE tld = ?"

	if !strings.HasPrefix(tldQuery, ".") {
		tldQuery = fmt.Sprintf(".%s", tldQuery)
	}

	tld := Tld{}
	err := s.db.Get(&tld, query, tldQuery)
	if err != nil {
		return Tld{}, fmt.Errorf("failed to execute query: %w", err)
	}

	return tld, nil

}

type Country struct {
	Cca2        string  `json:"cca2" db:"cca2"`
	Cca3        string  `json:"cca3" db:"cca3"`
	Name        string  `json:"name" db:"name"`
	Region      string  `json:"region" db:"region"`
	Subregion   string  `json:"subregion" db:"subregion"`
	CallingCode *string `json:"callingCode" db:"callingCode"`
	Capital     string  `json:"capital" db:"capital"`
	Independent bool    `json:"independent" db:"independent"`
	UnMember    bool    `json:"unMember" db:"unMember"`
}

func (s *service) GetCountries() ([]Country, error) {
	query := "SELECT * FROM countries"

	countries := []Country{}
	err := s.db.Select(&countries, query)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %w", err)
	}

	return countries, nil
}

func (s *service) GetCountry(code string) (Country, error) {
	query := "SELECT * FROM countries"

	whereClause := "WHERE cca2 = ?"
	if len(code) == 3 {
		whereClause = "WHERE cca3 = ?"
	}

	country := Country{}
	err := s.db.Get(&country, fmt.Sprintf("%s %s", query, whereClause), code)
	if err != nil {
		return Country{}, fmt.Errorf("failed to execute query: %w", err)
	}

	return country, nil
}

type CountryName struct {
	Cca2 string `json:"cca2" db:"cca2"`
	Name string `json:"name" db:"name"`
}

func (s *service) GetCountryNames() ([]CountryName, error) {
	query := "SELECT cca2, name FROM countries"

	countryNames := []CountryName{}
	err := s.db.Select(&countryNames, query)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %w", err)
	}

	return countryNames, nil
}

type GeoJson struct {
	CountryCode string          `json:"countryCode" db:"countryCode"`
	GeoJson     json.RawMessage `json:"geoJson" db:"geoJson"`
}

func (s *service) GetGeoJson(code string) (json.RawMessage, error) {
	query := "SELECT * FROM geoJson WHERE countryCode = ?"

	geoJson := GeoJson{}
	err := s.db.Get(&geoJson, query, code)
	if err != nil {
		return GeoJson{}.GeoJson, fmt.Errorf("failed to execute query: %w", err)
	}

	return geoJson.GeoJson, nil
}

type User = utils.User

func queryUser(query *sqlx.Row) (User, error) {
	var rolesData []byte
	user := User{}

	err := query.Scan(&user.Id, &user.Email, &rolesData, &user.Password)
	if err != nil {
		return User{}, fmt.Errorf("failed to execute query: %w", err)
	}

	err = json.Unmarshal(rolesData, &user.Roles)
	if err != nil {
		return User{}, fmt.Errorf("failed to unmarshal roles JSON: %w", err)
	}

	return user, nil
}

func (s *service) GetUser(userId int) (User, error) {
	query := "SELECT id, email, roles, password FROM users WHERE id = ?"

	return queryUser(s.db.QueryRowx(query, userId))
}

func (s *service) GetUserByEmail(email string) (User, error) {
	query := "SELECT id, email, roles, password FROM users WHERE email = ?"

	return queryUser(s.db.QueryRowx(query, email))
}

func (s *service) CreateUser(email, password string) (User, error) {
	query := "INSERT INTO users (email, password, roles) VALUES (?, ?, ?)"

	var columnCount int

	err := s.db.Get(&columnCount, "SELECT count(email) FROM users WHERE email = ?", email)
	if err != nil {
		return User{}, fmt.Errorf("failed to execute query: %w", err)
	}

	if columnCount > 0 {
		return User{}, fmt.Errorf("Email already used")
	}

	user := User{
		Email:    email,
		Password: password,
		Roles:    []utils.UserRole{utils.RoleUser},
	}

	rolesJSON, err := json.Marshal(user.Roles)
	if err != nil {
		return User{}, fmt.Errorf("Error marshalling JSON: %w", err)
	}

	rows, err := s.db.Exec(query, user.Email, user.Password, string(rolesJSON))
	if err != nil {
		return User{}, fmt.Errorf("failed to execute insert query: %w", err)
	}
	insertId, _ := rows.LastInsertId()

	insertedUser, err := s.GetUser(int(insertId))
	if err != nil {
		return User{}, fmt.Errorf("failed to get inserted user: %w", err)
	}

	return insertedUser, nil
}
