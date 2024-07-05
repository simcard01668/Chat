-- @block
CREATE TABLE users (
    id Integer PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    datetime TIMESTAMP NOT NULL default CURRENT_TIMESTAMP
)