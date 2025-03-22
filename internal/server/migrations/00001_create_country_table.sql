-- +goose Up
-- +goose StatementBegin
CREATE TABLE countries (
    name varchar(100) NOT NULL,
    capital varchar(100) NOT NULL,
    unMember tinyint(1) NOT NULL,
    region varchar(100) NOT NULL,
    subregion varchar(100) NOT NULL,
    cca3 varchar(3) NOT NULL UNIQUE,
    cca2 varchar(2) NOT NULL UNIQUE,
    callingCode varchar(10),

    PRIMARY KEY(cca3)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE countries;
-- +goose StatementEnd
