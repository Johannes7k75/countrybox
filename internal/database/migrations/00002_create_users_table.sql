-- +goose Up
-- +goose StatementBegin
CREATE TABLE users (
    id int AUTO_INCREMENT NOT NULL,
    email varchar(100) NOT NULL,
    password varchar(128) NOT NULL,
    roles JSON,

    PRIMARY KEY (id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE users;
-- +goose StatementEnd
