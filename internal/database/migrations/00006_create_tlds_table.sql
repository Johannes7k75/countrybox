-- +goose Up
-- +goose StatementBegin
CREATE TABLE tld (
    id INT AUTO_INCREMENT NOT NULL,
    tld VARCHAR(10) NOT NULL,
    countryCode VARCHAR(2) NOT NULL,

    PRIMARY KEY(id),
    FOREIGN KEY(countryCode) REFERENCES countries(cca2)
)
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE tld;
-- +goose StatementEnd
