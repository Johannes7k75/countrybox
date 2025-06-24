package database

import (
	"context"
	"country-box/internal/database/repo"
	"embed"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	_ "github.com/joho/godotenv/autoload"

	"github.com/pressly/goose/v3"
)

type Service struct {
	db        *sqlx.DB
	Box       *repo.BoxRepo
	Countries *repo.CountriesRepo
	GeoJson   *repo.GeoJsonRepo
	Tld       *repo.TldRepo
	User      *repo.UserRepo
	Settings  *repo.SettingsRepo
}

var (
	dbname     = os.Getenv("BLUEPRINT_DB_DATABASE")
	password   = os.Getenv("BLUEPRINT_DB_PASSWORD")
	username   = os.Getenv("BLUEPRINT_DB_USERNAME")
	port       = os.Getenv("BLUEPRINT_DB_PORT")
	host       = os.Getenv("BLUEPRINT_DB_HOST")
	dbInstance *Service
)

func New() *Service {
	if dbInstance != nil {
		return dbInstance
	}

	db := SetupDatabase()

	dbInstance = &Service{
		db:        db,
		Box:       repo.NewBoxRepository(db),
		Countries: repo.NewCountryRepository(db),
		GeoJson:   repo.NewGeoJsonRepository(db),
		Tld:       repo.NewTldRepository(db),
		User:      repo.NewUserRepository(db),
		Settings:  repo.NewSettingsRepository(db),
	}

	return dbInstance
}

//go:embed migrations/*.sql
var embedMigrations embed.FS

func SetupDatabase() *sqlx.DB {
	log.Println("Setting up db")

	DSN := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", username, password, host, port, dbname)

	db, err := OpenLoop("mysql", DSN, 0*time.Second)
	if err != nil {
		log.Fatal(err)
	}

	log.Println("Connected to DB")

	if err = db.Ping(); err != nil {
		panic(err)
	}
	log.Println("Pinged DB")

	goose.SetBaseFS(embedMigrations)

	if err := goose.SetDialect("mysql"); err != nil {
		panic(err)
	}

	if err := goose.Up(db.DB, "migrations"); err != nil {
		panic(err)
	}

	db.SetConnMaxLifetime(0)
	db.SetMaxIdleConns(6)
	db.SetMaxOpenConns(30)

	seeder := &Seeder{db: db}

	if isTableEmpty(db, "countries") {
		log.Println("Countries table is empty. Seeding...")
		seeder.SeedCountries()
	}

	if isTableEmpty(db, "tld") {
		log.Println("TLDs table is empty. Seeding...")
		seeder.SeedTlds()
	}

	if isTableEmpty(db, "geoJson") {
		log.Println("GeoJSON table is empty. Seeding...")
		seeder.SeedGeoJson()
	}

	log.Println("Database was configured successfully.")

	return db
}

func isTableEmpty(db *sqlx.DB, tableName string) bool {
	var count int
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s", tableName)
	err := db.Get(&count, query)
	if err != nil {
		log.Printf("Error checking table %s: %v", tableName, err)
		return false
	}
	return count == 0
}

func OpenLoop(driver, DSN string, timeout time.Duration) (*sqlx.DB, error) {
	start := time.Now()
	backoff := 1 * time.Second // Initial backoff
	maxBackoff := 10 * time.Second

	for {
		db, err := sqlx.Open(driver, DSN)
		if err == nil {
			if err = db.Ping(); err == nil {
				return db, nil // Success
			}
			db.Close() // Clean up if Ping fails
		}

		// Check timeout (if timeout > 0)
		if timeout > 0 && time.Since(start) >= timeout {
			return nil, fmt.Errorf("db connection failed after %s timeout", timeout)
		}

		log.Printf("connection attempt failed: %v (retrying in %v)", err, backoff)
		time.Sleep(backoff)

		// Exponential backoff with cap
		backoff *= 2
		if backoff > maxBackoff {
			backoff = maxBackoff // Stay at maxBackoff indefinitely
		}
	}
}

func (s *Service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	stats := make(map[string]string)

	err := s.db.PingContext(ctx)
	if err != nil {
		stats["status"] = "down"
		stats["error"] = fmt.Sprintf("db down: %v", err)
		log.Printf("db down: %v", err)
		return stats
	}

	stats["status"] = "up"
	stats["message"] = "It's healthy"

	dbStats := s.db.Stats()
	stats["open_connections"] = strconv.Itoa(dbStats.OpenConnections)
	stats["in_use"] = strconv.Itoa(dbStats.InUse)
	stats["idle"] = strconv.Itoa(dbStats.Idle)
	stats["wait_count"] = strconv.FormatInt(dbStats.WaitCount, 10)
	stats["wait_duration"] = dbStats.WaitDuration.String()
	stats["max_idle_closed"] = strconv.FormatInt(dbStats.MaxIdleClosed, 10)
	stats["max_lifetime_closed"] = strconv.FormatInt(dbStats.MaxLifetimeClosed, 10)

	if dbStats.OpenConnections > 40 {
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

func (s *Service) Close() error {
	log.Printf("Disconneted from database: %s", dbname)
	return s.db.Close()
}
