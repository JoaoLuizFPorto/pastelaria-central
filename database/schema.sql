-- Contas e endereços de entrega.
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL DEFAULT '',
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(11) NULL,
  address_postal_code VARCHAR(9) NOT NULL DEFAULT '',
  address_street VARCHAR(150) NOT NULL DEFAULT '',
  address_number VARCHAR(20) NOT NULL DEFAULT '',
  address_complement VARCHAR(100) NOT NULL DEFAULT '',
  address_district VARCHAR(100) NOT NULL DEFAULT '',
  address_city VARCHAR(100) NOT NULL DEFAULT '',
  address_state VARCHAR(2) NOT NULL DEFAULT '',
  address_reference VARCHAR(150) NOT NULL DEFAULT '',
  role ENUM('client','admin') NOT NULL DEFAULT 'client',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Sessões de clientes e visitantes.
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  csrf VARCHAR(64) NOT NULL,
  expires BIGINT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX(expires)
) ENGINE=InnoDB;

-- Catálogo, incluindo produtos inativos e excluídos.
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  price INT UNSIGNED NOT NULL,
  image VARCHAR(1000) NOT NULL,
  category VARCHAR(32) NOT NULL,
  subcategory VARCHAR(50) NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  home_rank INT NULL,
  description TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cart_items (
  owner VARCHAR(80) NOT NULL,
  product_id VARCHAR(80) NOT NULL,
  quantity INT NOT NULL,
  PRIMARY KEY(owner, product_id),
  CHECK(quantity BETWEEN 1 AND 99),
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  total INT UNSIGNED NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Registrado',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  order_id INT UNSIGNED NOT NULL,
  product_id VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  price INT UNSIGNED NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_status_history (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  status VARCHAR(80) NOT NULL,
  note VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX(order_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS favorites (
  owner VARCHAR(80) NOT NULL,
  product_id VARCHAR(80) NOT NULL,
  PRIMARY KEY(owner, product_id),
  FOREIGN KEY(product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- Fila de envio e tentativas das notificações por email.
CREATE TABLE IF NOT EXISTS order_emails (
  order_id INT UNSIGNED NOT NULL,
  event VARCHAR(16) NOT NULL DEFAULT 'registered',
  payload JSON NOT NULL,
  status ENUM('pending','processing','sent','failed') NOT NULL DEFAULT 'pending',
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  locked_at DATETIME NULL,
  sent_at DATETIME NULL,
  last_error VARCHAR(40) NULL,
  PRIMARY KEY(order_id,event),
  FOREIGN KEY(order_id) REFERENCES orders(id),
  INDEX(status,next_attempt)
) ENGINE=InnoDB;

-- Registra a preparação inicial para não repetir a importação do catálogo.
CREATE TABLE IF NOT EXISTS migrations (
  name VARCHAR(80) NOT NULL PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
