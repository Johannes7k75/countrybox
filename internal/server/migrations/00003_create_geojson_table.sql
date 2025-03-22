-- +goose Up
-- +goose StatementBegin
CREATE TABLE geoJson (
    countryCode varchar(2),
    geoJson JSON,

    FOREIGN KEY (countryCode) REFERENCES countries(cca2)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE geoJson;
-- +goose StatementEnd
