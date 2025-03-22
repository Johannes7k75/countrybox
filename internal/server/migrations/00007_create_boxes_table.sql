-- +goose Up
-- +goose StatementBegin
CREATE TABLE boxes (
    id INT AUTO_INCREMENT NOT NULL,
    userId INT,
    countryCode VARCHAR(2),
    trainedAt DATETIME,
    phase INT NOT NULL DEFAULT 0,

    PRIMARY KEY(id),
    FOREIGN KEY(countryCode) REFERENCES countries(cca2)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE boxes;
-- +goose StatementEnd
