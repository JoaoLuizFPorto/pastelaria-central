-- Pastelaria Central v9.0 - catálogo para entrega
-- Contém somente produtos oficiais e exemplos inativos/excluídos.
CREATE DATABASE IF NOT EXISTS `pastelaria_central_entrega` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pastelaria_central_entrega`;

-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: pastelaria_central_entrega
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `owner` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`owner`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `cart_items_chk_1` CHECK ((`quantity` between 1 and 99))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `owner` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`owner`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorites`
--

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `name` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_emails`
--

DROP TABLE IF EXISTS `order_emails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_emails` (
  `order_id` int unsigned NOT NULL,
  `payload` json NOT NULL,
  `status` enum('pending','processing','sent','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `attempts` int unsigned NOT NULL DEFAULT '0',
  `next_attempt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `locked_at` datetime DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `last_error` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'registered',
  PRIMARY KEY (`order_id`,`event`),
  KEY `status` (`status`,`next_attempt`),
  CONSTRAINT `order_emails_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_emails`
--

LOCK TABLES `order_emails` WRITE;
/*!40000 ALTER TABLE `order_emails` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_emails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `order_id` int unsigned NOT NULL,
  `product_id` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` int unsigned NOT NULL,
  `quantity` int NOT NULL,
  KEY `order_id` (`order_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status_history`
--

DROP TABLE IF EXISTS `order_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status_history` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int unsigned NOT NULL,
  `status` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`,`created_at`),
  CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_history`
--

LOCK TABLES `order_status_history` WRITE;
/*!40000 ALTER TABLE `order_status_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `total` int unsigned NOT NULL,
  `status` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Registrado',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` int unsigned NOT NULL,
  `image` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `subcategory` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `home_rank` int DEFAULT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES ('agua','Água',300,'/images/products/drinks/agua.png','bebida','Água sem gás.','2026-10-13 03:04:34','agua',1,4,0),('agua-com-gas','Água com Gás',300,'/images/products/drinks/agua-com-gas.png','bebida','Água com gás.','2026-10-13 03:04:34','agua',1,NULL,0),('cerveja-lata','Cerveja Lata',600,'/images/products/drinks/cerveja-lata.png','bebida','Cerveja em lata. Marca e volume não especificados no cardápio.','2026-10-13 03:04:34','cerveja',1,NULL,0),('coca-cola-200ml','Coca-Cola 200ml (Caçulinha)',350,'/images/products/drinks/coca-cola-200ml.png','bebida','Coca-Cola — 200ml.','2026-11-01 22:26:30','refrigerante',1,NULL,0),('coca-cola-2l','Coca-Cola 2L',1400,'/images/products/drinks/coca-cola-2l.png','bebida','Coca-Cola — 2L.','2026-10-13 03:04:34','refrigerante',1,NULL,0),('coca-cola-600ml','Coca-Cola 600ml',800,'/images/products/drinks/coca-cola-600ml.png','bebida','Coca-Cola — 600ml.','2026-10-13 03:04:34','refrigerante',1,NULL,0),('coca-cola-lata','Coca-Cola Lata',600,'/images/products/drinks/coca-cola-lata-350ml.png','bebida','Coca-Cola — Lata.','2026-10-13 03:04:34','refrigerante',1,1,0),('coxinha-frango','Coxinha de Frango',700,'/images/products/snacks/coxinha-frango.png','salgado','Coxinha de Frango.','2026-10-13 03:04:34','salgado-frito',1,NULL,0),('demo-excluido-coca-cola','Coca-Cola Lata (Teste Excluído)',600,'/images/products/drinks/coca-cola-lata-350ml.png','bebida','Coca-Cola — Lata.','2026-11-02 18:50:15','refrigerante',0,NULL,1),('demo-excluido-pastel-queijo','Pastel de Queijo (Teste Excluído)',1000,'/images/products/pastries/pastel-queijo.png','pastel','Pastel simples de queijo.','2026-11-02 18:50:15','pastel-salgado',0,NULL,1),('demo-inativo-fanta-laranja','Fanta Laranja Lata (Teste Inativo)',600,'/images/products/drinks/fanta-laranja-lata-350ml.png','bebida','Fanta Laranja — Lata.','2026-11-02 18:50:15','refrigerante',0,NULL,0),('demo-inativo-pastel-carne','Pastel de Carne (Teste Inativo)',1000,'/images/products/pastries/pastel-carne.png','pastel','Pastel simples de carne.','2026-11-02 18:50:15','pastel-salgado',0,NULL,0),('empanado-ovo-carne','Empanado de Ovo com Carne Moída',700,'/images/products/snacks/empanado-ovo-carne.png','salgado','Empanado de Ovo com Carne Moída.','2026-10-13 03:04:34','salgado-frito',1,NULL,0),('enrolado-presunto-queijo','Enrolado de Presunto e Queijo',700,'/images/products/snacks/enrolado-presunto-queijo.png','salgado','Enrolado de Presunto e Queijo.','2026-10-13 03:04:34','salgado-frito',1,NULL,0),('fanta-laranja','Fanta Laranja Lata',600,'/images/products/drinks/fanta-laranja-lata-350ml.png','bebida','Fanta Laranja — Lata.','2026-10-12 23:39:38','refrigerante',1,2,0),('fanta-laranja-200ml','Fanta Laranja 200ml (Caçulinha)',350,'/images/products/drinks/fanta-laranja-200ml.png','bebida','Fanta Laranja — 200ml.','2026-11-01 22:26:30','refrigerante',1,NULL,0),('fanta-laranja-2l','Fanta Laranja 2L',1400,'/images/products/drinks/fanta-laranja-2l.png','bebida','Fanta Laranja — 2L.','2026-10-13 03:04:34','refrigerante',1,NULL,0),('fanta-laranja-600ml','Fanta Laranja 600ml',800,'/images/products/drinks/fanta-laranja-600ml.png','bebida','Fanta Laranja — 600ml.','2026-10-13 03:04:34','refrigerante',1,NULL,0),('fanta-uva-200ml','Fanta Uva 200ml (Caçulinha)',350,'/images/products/drinks/fanta-uva-200ml.png','bebida','Fanta Uva — 200ml.','2026-11-01 22:26:30','refrigerante',1,NULL,0),('fanta-uva-2l','Fanta Uva 2L',1400,'/images/products/drinks/fanta-uva-2l.png','bebida','Fanta Uva — 2L.','2026-10-13 03:04:34','refrigerante',1,NULL,0),('fanta-uva-600ml','Fanta Uva 600ml',800,'/images/products/drinks/fanta-uva-600ml.png','bebida','Fanta Uva — 600ml.','2026-10-13 03:04:34','refrigerante',1,NULL,0),('fanta-uva-lata','Fanta Uva Lata',600,'/images/products/drinks/fanta-uva-lata-350ml.png','bebida','Fanta Uva — Lata.','2026-10-13 03:04:34','refrigerante',1,NULL,0),('guarana-antarctica-1l','Guaraná Antarctica 1L',700,'/images/products/drinks/guarana-antarctica-1l.png','bebida','Refrigerante Guaraná Antarctica — 1 litro.','2026-10-13 03:04:34','refrigerante',1,NULL,0),('guarana-antarctica-200ml','Guaraná Antarctica 200ml (Caçulinha)',350,'/images/products/drinks/guarana-antarctica-200ml.png','bebida','Guaraná Antarctica — 200ml.','2026-11-01 22:26:30','refrigerante',1,NULL,0),('guarana-antarctica-2l','Guaraná Antarctica 2L',1400,'/images/products/drinks/guarana-antarctica-2l.png','bebida','Guaraná Antarctica — 2L.','2026-10-13 03:04:34','refrigerante',1,NULL,0),('guarana-antarctica-lata','Guaraná Antarctica Lata',600,'/images/products/drinks/guarana-antarctica-lata-350ml.png','bebida','Guaraná Antarctica — Lata.','2026-10-13 03:04:34','refrigerante',1,3,0),('pastel-banana','Pastel de Banana',1000,'/images/products/pastries/pastel-banana.png','pastel','Banana\nCanela\nLeite condensado','2026-10-13 03:04:34','pastel-doce',1,NULL,0),('pastel-calabresa','Pastel de Calabresa',1000,'/images/products/pastries/pastel-calabresa.png','pastel','Pastel simples de calabresa.','2026-10-13 03:04:34','pastel-salgado',1,4,0),('pastel-carne','Pastel de Carne',1000,'/images/products/pastries/pastel-carne.png','pastel','Pastel simples de carne.','2026-10-13 03:04:34','pastel-salgado',1,1,0),('pastel-da-casa','Pastel da Casa',1300,'/images/products/pastries/pastel-da-casa.png','pastel','Frango\nBacon\nCheddar','2026-10-13 03:04:34','pastel-especial',1,NULL,0),('pastel-especial','Pastel Especial',1700,'/images/products/pastries/pastel-especial.png','pastel','Carne\nQueijo\nFrango\nPalmito\nCatupiry','2026-10-13 03:04:34','pastel-especial',1,NULL,0),('pastel-frango','Pastel de Frango',1000,'/images/products/pastries/pastel-frango.png','pastel','Pastel simples de frango.','2026-10-13 03:04:34','pastel-salgado',1,3,0),('pastel-hamburguer','Pastel Hambúrguer',1300,'/images/products/pastries/pastel-hamburguer.png','pastel','Hambúrguer\nQueijo\nTomate\nCatupiry','2026-10-13 03:04:34','pastel-especial',1,NULL,0),('pastel-misto-dois-recheios','Pastel Misto com 2 Recheios',1200,'/images/products/pastries/pastel-misto-dois-recheios.png','pastel','Pastel misto com dois recheios. Recheios a combinar com a pastelaria.','2026-10-13 03:04:34','pastel-salgado',1,NULL,0),('pastel-ouro-branco','Pastel Ouro Branco',1000,'/images/products/pastries/pastel-ouro-branco.png','pastel','Pastel doce de Ouro Branco.','2026-10-13 03:04:34','pastel-doce',1,NULL,0),('pastel-palmito','Pastel de Palmito',1000,'/images/products/pastries/pastel-palmito.png','pastel','Pastel simples de palmito.','2026-10-13 03:04:34','pastel-salgado',1,NULL,0),('pastel-pizza','Pastel de Pizza',1000,'/images/products/pastries/pastel-pizza.png','pastel','Pastel simples de pizza.','2026-10-13 03:04:34','pastel-salgado',1,5,0),('pastel-pizza-calabresa','Pastel de Pizza Calabresa',1200,'/images/products/pastries/pastel-pizza-calabresa.png','pastel','Pastel de pizza com calabresa.','2026-10-13 03:04:34','pastel-especial',1,NULL,0),('pastel-pizza-carne','Pastel de Pizza Carne',1200,'/images/products/pastries/pastel-pizza-carne.png','pastel','Pastel de pizza com carne.','2026-10-13 03:04:34','pastel-especial',1,NULL,0),('pastel-pizza-frango','Pastel de Pizza Frango',1200,'/images/products/pastries/pastel-pizza-frango.png','pastel','Pastel de pizza com frango.','2026-10-13 03:04:34','pastel-especial',1,NULL,0),('pastel-pizza-palmito','Pastel de Pizza Palmito',1200,'/images/products/pastries/pastel-pizza-palmito.png','pastel','Pastel de pizza com palmito.','2026-10-13 03:04:34','pastel-especial',1,NULL,0),('pastel-queijo','Pastel de Queijo',1000,'/images/products/pastries/pastel-queijo.png','pastel','Pastel simples de queijo.','2026-10-12 23:39:38','pastel-salgado',1,2,0),('pastel-simples-catupiry','Pastel Simples com Catupiry',1200,'/images/products/pastries/pastel-simples-catupiry.png','pastel','Pastel simples com Catupiry. Recheio base a combinar com a pastelaria.','2026-10-13 03:04:34','pastel-salgado',1,NULL,0),('pastel-sonho-de-valsa','Pastel Sonho de Valsa',1000,'/images/products/pastries/pastel-sonho-de-valsa.png','pastel','Pastel doce de Sonho de Valsa.','2026-10-13 03:04:34','pastel-doce',1,NULL,0),('risoles','Risoles',700,'/images/products/snacks/risoles.png','salgado','Risoles.','2026-10-13 03:04:34','salgado-frito',1,NULL,0),('sprite-200ml','Sprite 200ml (Caçulinha)',350,'/images/products/drinks/sprite-200ml.png','bebida','Sprite — 200ml.','2026-11-01 22:26:30','refrigerante',1,NULL,0),('sprite-2l','Sprite 2L',1400,'/images/products/drinks/sprite-2l.png','bebida','Sprite — 2L.','2026-10-13 03:04:34','refrigerante',1,NULL,0),('sprite-lata','Sprite Lata',600,'/images/products/drinks/sprite-lata-350ml.png','bebida','Sprite — Lata.','2026-10-13 03:04:34','refrigerante',1,NULL,0),('suco-natural-copo','Suco Natural — Copo',700,'/images/products/drinks/suco-natural-copo.png','bebida','Suco natural — Copo. Sabor a combinar com a pastelaria.','2026-10-13 03:04:34','suco-natural',1,5,0),('suco-natural-jarra-1l','Suco Natural — Jarra 1L',1500,'/images/products/drinks/suco-natural-jarra-1l.png','bebida','Suco natural — Jarra 1L. Sabor a combinar com a pastelaria.','2026-10-13 03:04:34','suco-natural',1,NULL,0),('suco-natural-jarra-500ml','Suco Natural — Jarra 500ml',900,'/images/products/drinks/suco-natural-jarra-500ml.png','bebida','Suco natural — Jarra 500ml. Sabor a combinar com a pastelaria.','2026-10-13 03:04:34','suco-natural',1,NULL,0);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `csrf` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `expires` (`expires`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('client','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'client',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `phone` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `surname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `address_postal_code` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `address_street` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `address_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `address_complement` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `address_district` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `address_city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `address_state` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `address_reference` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-02 16:59:59
