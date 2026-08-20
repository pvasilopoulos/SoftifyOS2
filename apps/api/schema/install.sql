CREATE DATABASE IF NOT EXISTS softifyos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'softify'@'localhost' IDENTIFIED BY 'softify';
GRANT ALL PRIVILEGES ON softifyos.* TO 'softify'@'localhost';
FLUSH PRIVILEGES;

USE softifyos;

DROP TABLE IF EXISTS record_relations;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS layouts;
DROP TABLE IF EXISTS views;
DROP TABLE IF EXISTS forms;
DROP TABLE IF EXISTS records;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS orgs;

CREATE TABLE orgs (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  plan VARCHAR(40) NOT NULL DEFAULT 'Studio'
);

CREATE TABLE users (
  id VARCHAR(40) PRIMARY KEY,
  org_id VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(40) NOT NULL DEFAULT 'Member',
  hue INT NOT NULL DEFAULT 250,
  CONSTRAINT fk_users_org FOREIGN KEY (org_id) REFERENCES orgs(id)
);

CREATE TABLE sessions (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  INDEX idx_token (token_hash),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE records (
  id VARCHAR(40) PRIMARY KEY,
  org_id VARCHAR(40) NOT NULL,
  type VARCHAR(40) NOT NULL,
  title VARCHAR(240) NOT NULL,
  fields_json JSON NOT NULL,
  created_at VARCHAR(40) NOT NULL,
  updated_at VARCHAR(40) NOT NULL,
  INDEX idx_records_type (org_id, type),
  CONSTRAINT fk_records_org FOREIGN KEY (org_id) REFERENCES orgs(id)
);

CREATE TABLE record_relations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id VARCHAR(40) NOT NULL,
  kind VARCHAR(40) NOT NULL,
  related_id VARCHAR(40) NOT NULL,
  CONSTRAINT fk_rel_record FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
);

CREATE TABLE layouts (
  id VARCHAR(40) PRIMARY KEY,
  org_id VARCHAR(40) NOT NULL,
  module_id VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  object_type VARCHAR(40) NOT NULL DEFAULT '',
  kind VARCHAR(40) NOT NULL DEFAULT '',
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  schema_json JSON NOT NULL,
  INDEX idx_layouts_mod (org_id, module_id)
);

CREATE TABLE views (
  id VARCHAR(40) PRIMARY KEY,
  org_id VARCHAR(40) NOT NULL,
  module_id VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  object_type VARCHAR(40) NOT NULL DEFAULT '',
  kind VARCHAR(40) NOT NULL DEFAULT '',
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  schema_json JSON NOT NULL,
  INDEX idx_views_mod (org_id, module_id)
);

CREATE TABLE forms (
  id VARCHAR(40) PRIMARY KEY,
  org_id VARCHAR(40) NOT NULL,
  module_id VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  object_type VARCHAR(40) NOT NULL DEFAULT '',
  kind VARCHAR(40) NOT NULL DEFAULT '',
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  schema_json JSON NOT NULL,
  INDEX idx_forms_mod (org_id, module_id)
);
