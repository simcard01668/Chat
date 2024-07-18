-- @block
-- SELECT * FROM users;

-- CREATE TABLE users (
--     id Integer PRIMARY KEY AUTO_INCREMENT,
--     username VARCHAR(255) NOT NULL UNIQUE,
--     password VARCHAR(255) NOT NULL,
--     email VARCHAR(255) NOT NULL,
--     datetime TIMESTAMP NOT NULL default CURRENT_TIMESTAMP
-- )

-- CREATE TABLE messages (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     room_id VARCHAR(255),
--     sender_id VARCHAR(255),
--     message VARCHAR(255),
--     timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
--     status ENUM('read', 'unread') DEFAULT 'unread'
-- )

-- TRUNCATE TABLE messages;
-- truncate table users;