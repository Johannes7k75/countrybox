-- +goose Up
-- +goose StatementBegin
CREATE TABLE settings (
    id INT AUTO_INCREMENT NOT NULL,
    phases JSON,
    
    user INT NOT NULL UNIQUE,

    FOREIGN KEY (user) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    PRIMARY KEY (id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE settings;
-- +goose StatementEnd
