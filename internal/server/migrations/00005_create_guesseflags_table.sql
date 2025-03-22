-- +goose Up
-- +goose StatementBegin
CREATE TABLE guessedFlags (
    id INT AUTO_INCREMENT NOT NULL,
    gameId INT,
    userId INT NOT NULL,
    correct TINYINT(1) NOT NULL DEFAULT 1,
    guessedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY(id),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (gameId) REFERENCES games(id)
)
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE guessedFlags;
-- +goose StatementEnd
