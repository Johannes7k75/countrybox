-- +goose Up
-- +goose StatementBegin
CREATE TABLE games (
    id INT AUTO_INCREMENT NOT NULL,
    userId INT NOT NULL,
    firstType VARCHAR(20) NOT NULL,
    secondType VARCHAR(20) NOT NULL,
    round INT NOT NULL DEFAULT 0,
    rounds INT NOT NULL DEFAULT 10,
    startedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finishedAt DATETIME,

    PRIMARY KEY(id),
    FOREIGN KEY (userId) REFERENCES users(id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE games;
-- +goose StatementEnd
