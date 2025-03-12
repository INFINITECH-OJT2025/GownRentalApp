-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 11, 2025 at 02:19 AM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gownrentals`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` bigint UNSIGNED NOT NULL,
  `reference_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `discounted_price` decimal(10,2) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `added_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_price` decimal(10,2) NOT NULL,
  `gcash_receipt` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `voucher_fee` decimal(10,2) NOT NULL DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `reference_number`, `user_id`, `product_id`, `discounted_price`, `start_date`, `end_date`, `added_price`, `total_price`, `gcash_receipt`, `status`, `created_at`, `updated_at`, `voucher_fee`) VALUES
(1, '9D03B5C27C', 21, 2, '1125.00', '2025-02-28', '2025-03-10', '1150.00', '3425.00', 'receipts/NNkKaUhl54vMm1j3fb3VDkLhmn1TzPeNqRiQCogx.png', 'approved', '2025-03-09 02:18:41', '2025-03-09 02:50:48', '0.00'),
(2, '78B55A4C2F', 21, 2, '1125.00', '2025-02-28', '2025-03-10', '1150.00', '3425.00', 'receipts/bFKZER3p1Wd4yuctB0MVk2xY2ROFbqqPhunChmL7.png', 'returned', '2025-03-09 02:20:44', '2025-03-09 02:50:36', '0.00'),
(3, '4121E96C2E', 21, 2, '1125.00', '2025-02-28', '2025-03-10', '1150.00', '3425.00', 'receipts/Eb0r0zJzy156JSw2QQRxgl5y4orBY0bMRPCjM9WY.png', 'picked up', '2025-03-09 02:35:20', '2025-03-09 02:50:57', '0.00'),
(4, '29C6EFBF97', 21, 2, '1125.00', '2025-02-28', '2025-03-10', '1150.00', '3425.00', NULL, 'canceled', '2025-03-09 02:41:42', '2025-03-09 02:49:19', '0.00'),
(5, '08FA95990B', 21, 3, '17300.00', '2025-02-28', '2025-03-10', '1150.00', '17300.00', NULL, 'pending', '2025-03-09 02:51:44', '2025-03-09 02:51:44', '0.00');

--
-- Triggers `bookings`
--
DELIMITER $$
CREATE TRIGGER `after_booking_approval` AFTER UPDATE ON `bookings` FOR EACH ROW BEGIN
    -- ✅ Only update if status changed to 'approved'
    IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
        
        -- ✅ Update total_bookings for the user
        UPDATE users 
        SET total_bookings = (SELECT COUNT(*) FROM bookings WHERE user_id = NEW.user_id AND status = 'approved')
        WHERE id = NEW.user_id;

        -- ✅ Calculate loyalty points based on approved bookings
        UPDATE users 
        SET loyalty_points = FLOOR(total_bookings / 3) * 100 
        WHERE id = NEW.user_id;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_booking_insert` AFTER INSERT ON `bookings` FOR EACH ROW BEGIN
    -- ✅ Only update if booking is approved
    IF NEW.status = 'approved' THEN
        
        -- ✅ Get the current total approved bookings for the user
        SET @current_total = (SELECT COUNT(*) FROM bookings WHERE user_id = NEW.user_id AND status = 'approved');

        -- ✅ Calculate new loyalty points to add (100 for every 25 new approved bookings)
        SET @new_loyalty_points = FLOOR(@current_total / 3) * 100;

        -- ✅ Update user's loyalty points correctly
        UPDATE users 
        SET total_bookings = @current_total,
            loyalty_points = loyalty_points + ( @new_loyalty_points - (FLOOR((@current_total - 1) / 3) * 100) )
        WHERE id = NEW.user_id;
        
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `chats`
--

CREATE TABLE `chats` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `receiver_id` bigint UNSIGNED NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chats`
--

INSERT INTO `chats` (`id`, `user_id`, `receiver_id`, `message`, `is_read`, `created_at`, `updated_at`) VALUES
(1, 21, 22, 'hi', 0, '2025-03-10 16:46:37', '2025-03-10 16:46:37'),
(2, 22, 21, 'hi', 1, '2025-03-10 16:47:02', '2025-03-10 16:47:03'),
(3, 22, 21, 'new', 1, '2025-03-10 16:47:37', '2025-03-10 16:47:38'),
(4, 22, 21, 'hi', 1, '2025-03-10 16:48:05', '2025-03-10 16:48:08'),
(5, 22, 21, 'hi', 1, '2025-03-10 16:48:17', '2025-03-10 16:48:18'),
(6, 22, 21, 'hiiiii', 1, '2025-03-10 17:09:04', '2025-03-10 17:09:07'),
(7, 22, 21, 'heyoooooooo', 1, '2025-03-10 17:09:17', '2025-03-10 17:09:19'),
(8, 22, 21, 'heyooooo', 1, '2025-03-10 17:09:37', '2025-03-10 17:09:39'),
(9, 22, 21, 'hey', 1, '2025-03-10 17:09:49', '2025-03-10 17:09:50'),
(10, 22, 21, 'hey', 1, '2025-03-10 17:15:31', '2025-03-10 17:15:34'),
(11, 22, 21, 'hi', 1, '2025-03-10 17:15:52', '2025-03-10 17:15:54'),
(12, 22, 21, 'heyy', 1, '2025-03-10 17:16:29', '2025-03-10 17:16:30'),
(13, 22, 21, 'hi', 1, '2025-03-10 17:17:12', '2025-03-10 17:17:14'),
(14, 22, 21, 'heyyyow', 1, '2025-03-10 17:17:42', '2025-03-10 17:17:44'),
(15, 22, 21, 'hi', 1, '2025-03-10 17:22:29', '2025-03-10 17:22:34'),
(16, 22, 21, 'heyy', 1, '2025-03-10 17:22:46', '2025-03-10 17:22:49'),
(17, 22, 21, 'heyyy', 1, '2025-03-10 17:23:03', '2025-03-10 17:23:06'),
(18, 22, 21, 'iiii', 1, '2025-03-10 17:25:49', '2025-03-10 17:25:50'),
(19, 22, 21, 'lol!', 1, '2025-03-10 17:26:14', '2025-03-10 17:26:17'),
(20, 22, 21, 'hey', 1, '2025-03-10 17:26:41', '2025-03-10 17:26:45'),
(21, 22, 21, 'hello', 1, '2025-03-10 17:28:59', '2025-03-10 17:28:59'),
(22, 22, 21, 'hi', 1, '2025-03-10 17:33:29', '2025-03-10 17:33:29'),
(23, 22, 21, 'hi new message', 1, '2025-03-10 17:33:48', '2025-03-10 17:33:49'),
(24, 22, 21, 'hi', 1, '2025-03-10 18:18:11', '2025-03-10 18:18:14');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `favorites`
--

INSERT INTO `favorites` (`id`, `user_id`, `product_id`, `created_at`, `updated_at`) VALUES
(27, 18, 1, '2025-02-20 17:38:13', '2025-02-20 17:38:13'),
(28, 18, 2, '2025-02-20 19:44:43', '2025-02-20 19:44:43'),
(29, 19, 1, '2025-02-22 19:38:16', '2025-02-22 19:38:16'),
(73, 16, 2, '2025-02-25 05:50:58', '2025-02-25 05:50:58'),
(75, 16, 1, '2025-02-25 06:29:02', '2025-02-25 06:29:02'),
(76, 16, 4, '2025-02-25 06:29:08', '2025-02-25 06:29:08'),
(77, 16, 6, '2025-02-25 06:33:50', '2025-02-25 06:33:50'),
(78, 16, 5, '2025-02-25 06:33:54', '2025-02-25 06:33:54'),
(79, 16, 3, '2025-02-25 06:33:59', '2025-02-25 06:33:59'),
(80, 20, 6, '2025-02-25 16:12:02', '2025-02-25 16:12:02'),
(82, 20, 2, '2025-02-26 00:28:56', '2025-02-26 00:28:56'),
(83, 20, 3, '2025-02-26 00:29:02', '2025-02-26 00:29:02'),
(85, 21, 2, '2025-03-04 06:22:50', '2025-03-04 06:22:50'),
(86, 21, 6, '2025-03-09 07:23:16', '2025-03-09 07:23:16'),
(87, 21, 4, '2025-03-09 10:08:32', '2025-03-09 10:08:32');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2014_10_12_000000_create_users_table', 1),
(2, '2014_10_12_100000_create_password_reset_tokens_table', 1),
(3, '2019_08_19_000000_create_failed_jobs_table', 1),
(4, '2019_12_14_000001_create_personal_access_tokens_table', 1),
(5, '2025_02_16_102334_create_students_table', 1),
(6, '2025_02_17_064509_create_products_table', 1),
(7, '2025_02_17_152245_update_availability_column_in_products_table', 1),
(8, '2025_02_18_025348_create_wishlists_table', 1),
(9, '2025_02_18_120852_create_favorites_table', 1),
(10, '2016_06_01_000001_create_oauth_auth_codes_table', 2),
(11, '2016_06_01_000002_create_oauth_access_tokens_table', 2),
(12, '2016_06_01_000003_create_oauth_refresh_tokens_table', 2),
(13, '2016_06_01_000004_create_oauth_clients_table', 2),
(14, '2016_06_01_000005_create_oauth_personal_access_clients_table', 2),
(15, '2025_02_21_015704_create_bookings_table', 3),
(16, '2025_02_21_054446_add_gcash_receipt_to_bookings', 4),
(17, '2025_02_23_014807_add_status_to_bookings', 5),
(18, '2025_02_23_020134_add_reference_number_to_bookings', 6),
(19, '2025_02_23_071033_add_start_end_date_to_products_table', 6),
(20, '2025_02_24_003021_add_role_to_users_table', 7),
(21, '2025_02_26_032050_create_chats_table', 8),
(22, '2025_02_28_003612_add_payment_qrcode_to_users_table', 8),
(23, '2025_03_01_014759_add_stock_to_products_table', 9),
(24, '2025_03_01_045603_add_loyalty_fields_to_users', 10),
(25, '2025_03_02_103952_add_is_hidden_to_products_table', 11),
(26, '2025_03_02_143541_create_stock_adjustments_table', 12),
(27, '2025_03_02_145929_create_stock_logs_table', 13),
(28, '2025_03_03_072334_create_reviews_table', 14),
(30, '2025_03_03_132644_add_admin_reply_to_reviews_table', 15);

-- --------------------------------------------------------

--
-- Table structure for table `oauth_access_tokens`
--

CREATE TABLE `oauth_access_tokens` (
  `id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `client_id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scopes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `revoked` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `oauth_access_tokens`
--

INSERT INTO `oauth_access_tokens` (`id`, `user_id`, `client_id`, `name`, `scopes`, `revoked`, `created_at`, `updated_at`, `expires_at`) VALUES
('08cd7518640d8b69959df982ec5003a8450462a9b0eb0f2b9d723c46cea877185da2531ae85e6871', 20, 4, 'authToken', '[]', 0, '2025-03-10 12:10:39', '2025-03-10 12:10:39', '2025-09-10 20:10:39'),
('2589325619a59f7336c6ec1c95111da3290a299c340f25b871e5204850aa32836dee636db64ea29c', 20, 4, 'authToken', '[]', 0, '2025-03-10 12:10:30', '2025-03-10 12:10:30', '2025-09-10 20:10:30'),
('707eabc506d68291c7997ed9e67047c6f3e9d33fbea7304183cd026c1098ddc890c86fe2de5529a5', 20, 4, 'authToken', '[]', 0, '2025-03-05 16:43:38', '2025-03-05 16:43:38', '2025-09-06 00:43:38'),
('81769e73f3c90f291dbdb7fa3353c3580fd18090139a4627d552edc28404399eedfc32a82f442e3d', 21, 4, 'authToken', '[]', 0, '2025-03-10 16:43:49', '2025-03-10 16:43:49', '2025-09-11 00:43:49'),
('90311507e264911c7a1526df30fdac1cc54006f0f6a21e6e19f61e29cdc4eb3f0aa5ade7b1fe2433', 20, 4, 'authToken', '[]', 0, '2025-03-10 12:10:56', '2025-03-10 12:10:56', '2025-09-10 20:10:56'),
('ab4e2a47ebf754127f3d14c49108bef174069fb472b597e6ec6c6cf0ca5025a891361de11bac695f', 14, 4, 'GownRentalApp', '[]', 0, '2025-02-18 18:26:26', '2025-02-18 18:26:27', '2025-08-19 02:26:26'),
('acf51bb8b74bcc4b206b73f7721893ecd27898badcf1c1b00f25ee0d8fadbb423300d0fa39558722', 15, 4, 'GownRentalApp', '[]', 0, '2025-02-18 18:31:22', '2025-02-18 18:31:22', '2025-08-19 02:31:22'),
('cc72966e3450860788860f27accdf2eea7ad154bd1235a6d03f53ecb648266681cf9a43a33d614e1', 20, 4, 'authToken', '[]', 0, '2025-03-05 17:17:02', '2025-03-05 17:17:03', '2025-09-06 01:17:02'),
('d0cad7c21bbaec85956062d562a4b0f13f48da9852fb919ff62d9b3274eb3942c77208d0f38b0148', 20, 4, 'authToken', '[]', 0, '2025-03-05 17:30:37', '2025-03-05 17:30:37', '2025-09-06 01:30:37'),
('f17c3e2cdbe4f8f7d621ceaf8032c8f32c28812a5572b24e7d7f3c2f954e4d1b1881ad3db99197e2', 20, 4, 'authToken', '[]', 0, '2025-03-05 17:25:24', '2025-03-05 17:25:24', '2025-09-06 01:25:24'),
('f20ee037462d5e1fda665de248c03a32f82277a784d080596478db386bd394e983164351c4c1a36e', 22, 4, 'authToken', '[]', 0, '2025-03-10 16:45:27', '2025-03-10 16:45:27', '2025-09-11 00:45:27');

-- --------------------------------------------------------

--
-- Table structure for table `oauth_auth_codes`
--

CREATE TABLE `oauth_auth_codes` (
  `id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `client_id` bigint UNSIGNED NOT NULL,
  `scopes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `revoked` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `oauth_clients`
--

CREATE TABLE `oauth_clients` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `secret` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `redirect` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `personal_access_client` tinyint(1) NOT NULL,
  `password_client` tinyint(1) NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `oauth_clients`
--

INSERT INTO `oauth_clients` (`id`, `user_id`, `name`, `secret`, `provider`, `redirect`, `personal_access_client`, `password_client`, `revoked`, `created_at`, `updated_at`) VALUES
(1, NULL, 'Laravel Personal Access Client', 'suh0BODkn4m7vIxibtMCjvmqVFGx4RMIIC89cAVA', NULL, 'http://localhost', 1, 0, 0, '2025-02-18 17:03:33', '2025-02-18 17:03:33'),
(2, NULL, 'Laravel Password Grant Client', '1uYxANCGzJSRFoTf9nRkFp45w5g3A0WgpowWBLPS', 'users', 'http://localhost', 0, 1, 0, '2025-02-18 17:03:33', '2025-02-18 17:03:33'),
(3, NULL, 'GownRental API Client', '$2y$10$6zMFWCf927Mx24NCmIEyN.GdQ2smXwkwVVNtZhFou6NPdKmX7do26', NULL, 'http://127.0.0.1:8000/auth/callback', 0, 0, 0, '2025-02-18 17:24:58', '2025-02-18 17:24:58'),
(4, NULL, 'Laravel Personal Access Client', '$2y$10$vXLeeV5ftspezHEyBGnjoeZoQ.pWhlrbzllx8WfIheOsAQl7WPtnG', NULL, 'http://localhost', 1, 0, 0, '2025-02-18 18:13:21', '2025-02-18 18:13:21');

-- --------------------------------------------------------

--
-- Table structure for table `oauth_personal_access_clients`
--

CREATE TABLE `oauth_personal_access_clients` (
  `id` bigint UNSIGNED NOT NULL,
  `client_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `oauth_personal_access_clients`
--

INSERT INTO `oauth_personal_access_clients` (`id`, `client_id`, `created_at`, `updated_at`) VALUES
(1, 1, '2025-02-18 17:03:33', '2025-02-18 17:03:33'),
(2, 4, '2025-02-18 18:13:21', '2025-02-18 18:13:21');

-- --------------------------------------------------------

--
-- Table structure for table `oauth_refresh_tokens`
--

CREATE TABLE `oauth_refresh_tokens` (
  `id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `access_token_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `discounted_price` decimal(10,2) DEFAULT NULL,
  `stock` int NOT NULL DEFAULT '1',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `category` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_hidden` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `image`, `price`, `discounted_price`, `stock`, `description`, `category`, `start_date`, `end_date`, `created_at`, `updated_at`, `is_hidden`) VALUES
(1, 'Anna', 'gowns/gown1.png', '13000.00', NULL, 0, 'Elegant and sophisticated gowns perfect for formal events, galas, or black-tie occasions.', 'Evening Dresses', '2025-02-28', '2025-03-10', NULL, '2025-03-05 22:20:37', 0),
(2, 'Alex', 'gowns/gown2.png', '1500.00', '1125.00', 67, 'A flattering dress with a wrap-around waist that accentuates curves while offering a relaxed yet polished look.', 'Debut Dresses', '2025-02-28', '2025-03-10', NULL, '2025-03-09 02:49:19', 0),
(3, 'Ador', 'gowns/gown3.png', '15000.00', NULL, 1, 'A dazzling dress adorned with shimmering sequins, making it the perfect choice for a red-carpet-inspired prom look.', 'Casual Dresses', '2025-02-28', '2025-03-10', NULL, '2025-03-05 22:18:39', 0),
(4, 'Abeygail', 'gowns/gown4.png', '12000.00', NULL, 1, 'A form-fitting dress that hugs the body and flares out at the knees, adding a dramatic yet sophisticated touch.', 'Bridal Dresses', '2025-02-28', '2025-03-10', NULL, '2025-03-05 22:18:30', 0),
(5, 'Andi', 'gowns/gown5.png', '11000.00', NULL, 10, 'A charming dress with retro elements like delicate embroidery, beaded embellishments, and long lace sleeves for a timeless appeal.', 'Evening Dresses', '2025-02-28', '2025-03-10', NULL, '2025-03-05 22:20:02', 0),
(6, 'Asa', 'gowns/gown6.png', '14600.00', NULL, 34, 'A bold yet sophisticated dress featuring a high slit for added drama, paired with a sleek, form-fitting bodice.', 'Prom Dresses', '2025-02-26', '2025-04-05', NULL, '2025-03-02 21:05:04', 0),
(7, 'Asoka', 'products/M94SswrrpIMV5Uje4kTC1RD1Np2btaMpElp17U6w.png', '1500.00', NULL, 20, 'This stunning A-line wedding dress by [Designer] features delicate lace appliqués and intricate beadwork that adds a touch of elegance', 'Wedding Dress', '2025-03-01', '2025-03-11', '2025-03-01 20:33:12', '2025-03-05 22:19:51', 0),
(18, 'Andrea', 'products/67c42533cef6d.png', '12500.00', NULL, 21, 'This stunning A-line wedding dress by [Designer] features delicate lace appliqués and intricate beadwork that adds a touch of elegance', 'Prom Dresses', '2025-03-02', '2025-03-18', '2025-03-02 00:37:23', '2025-03-02 07:26:50', 0),
(20, 'Angelina222', 'products/67c52188230cb.png', '13000.00', NULL, 82, 'hdjfhsj', 'Prom Dresses', '2025-03-03', '2025-03-12', '2025-03-02 19:27:06', '2025-03-03 00:13:44', 0);

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `booking_id` bigint UNSIGNED NOT NULL,
  `rating` int NOT NULL DEFAULT '5',
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `admin_reply` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `product_id`, `user_id`, `booking_id`, `rating`, `comment`, `admin_reply`, `created_at`, `updated_at`) VALUES
(6, 2, 21, 0, 5, 'Cute Dress!', NULL, '2025-03-03 05:07:48', '2025-03-03 05:29:07'),
(7, 2, 21, 167, 5, 'Again , for the second time.. this is a good product', NULL, '2025-03-03 05:48:24', '2025-03-03 05:48:24'),
(8, 3, 21, 171, 5, 'Nice one!', NULL, '2025-03-03 06:30:41', '2025-03-03 06:30:41'),
(9, 2, 21, 170, 5, 'fsdhjfsd', NULL, '2025-03-03 06:52:04', '2025-03-03 06:52:04'),
(10, 2, 21, 169, 5, 'dhsgfhsgd', NULL, '2025-03-03 06:52:20', '2025-03-03 06:52:20'),
(11, 4, 21, 172, 5, 'Nice Dress!', NULL, '2025-03-03 16:13:30', '2025-03-03 16:13:30'),
(12, 4, 21, 174, 3, 'nicee', NULL, '2025-03-03 16:29:04', '2025-03-03 16:29:04'),
(13, 4, 21, 173, 3, 'Good', NULL, '2025-03-03 16:29:24', '2025-03-03 16:29:24'),
(14, 3, 21, 175, 4, 'Good Product!', NULL, '2025-03-03 19:22:33', '2025-03-03 19:23:01'),
(15, 1, 16, 1, 5, NULL, NULL, '2025-03-04 21:46:06', '2025-03-04 21:46:06');

-- --------------------------------------------------------

--
-- Table structure for table `stock_adjustments`
--

CREATE TABLE `stock_adjustments` (
  `id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `stock_added` int NOT NULL,
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock_adjustments`
--

INSERT INTO `stock_adjustments` (`id`, `product_id`, `stock_added`, `remarks`, `created_at`, `updated_at`) VALUES
(1, 2, 10, 'Stock manually adjusted', '2025-03-03 04:41:04', NULL),
(2, 20, 10, 'Stock manually adjusted', '2025-03-02 21:22:49', '2025-03-02 21:22:49'),
(3, 5, 10, 'Stock manually adjusted', '2025-03-02 21:23:04', '2025-03-02 21:23:04'),
(4, 20, 10, 'Stock manually adjusted', '2025-03-03 00:13:44', '2025-03-03 00:13:44');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `student_id` bigint UNSIGNED NOT NULL,
  `first_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `year_level` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `total_bookings` int NOT NULL DEFAULT '0',
  `loyalty_points` int NOT NULL DEFAULT '0',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_qrcode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `total_bookings`, `loyalty_points`, `name`, `email`, `role`, `image`, `address`, `bio`, `payment_qrcode`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 0, 0, 'Shekinah Anisette Valdez', 'shekinah@gmail.com', 'customer', '', '', '', NULL, NULL, '$2y$12$n8u0PGVJPoo61dphIdr5cuzCfskfOmclzlxvpK29zgZy8g22HEjP6', NULL, '2025-02-18 16:57:13', '2025-02-18 16:57:13'),
(2, 0, 0, 'newnew', 'newnew@gmail.com', 'customer', '', '', '', NULL, NULL, '$2y$12$7cvIwiDnOd/tgDRAVNP3veK1xAST2e0zM5EUA9ZKGlhEtLHhkcIV.', NULL, '2025-02-18 17:01:06', '2025-02-18 17:01:06'),
(3, 0, 0, 'newnew', 'njjjewnew@gmail.com', 'customer', '', '', '', NULL, NULL, '$2y$12$x2ZIGWFgRSmQw6pBxpQHRuSk2Tg8McOd4jJ/KvGHCsdYXBoseeFxy', NULL, '2025-02-18 17:02:09', '2025-02-18 17:02:09'),
(4, 0, 0, 'lolShekinah Anisette Valdez', 'lolshekinahvaldez2003@gmail.com', 'customer', '', '', '', NULL, NULL, '$2y$12$r12cNLisGFCZ4bpTaYuNzOIpGItoR40os6h173Qv1oKaV0KgzeXxu', NULL, '2025-02-18 17:29:33', '2025-02-18 17:29:33'),
(5, 0, 0, 'chocolatey', 'kk@gmail.com', 'customer', '', '', '', NULL, NULL, '$2y$12$qTYaGP4eqTdVzhFXE4/0ku4rTSuY.w9qa/Ex6GX5qixKW9bUwGnIW', NULL, '2025-02-18 17:50:52', '2025-02-18 17:50:52'),
(6, 0, 0, 'chocolatey', 'kkkk@gmail.com', 'customer', '', '', '', NULL, NULL, '$2y$12$vo1Emg4GgwSoPJ6I/wtRUONYf9Dv/SE/ZTuU8bGbTzeuZoMY4CNmm', NULL, '2025-02-18 17:55:27', '2025-02-18 17:55:27'),
(7, 0, 0, 'chocolatey', 'lkkkkkk@gmail.com', 'customer', '', '', '', NULL, NULL, '$2y$12$udX2TBO402y/K9pNjzxIvuMz7jEA3V4ZzyCNlhNLnifwYjyde8Viy', NULL, '2025-02-18 17:55:50', '2025-02-18 17:55:50'),
(8, 0, 0, 'chocolatey', 'shekinahvaldezsss2003@gmail.com', 'customer', '', '', '', NULL, NULL, '$2y$12$s6fufsAUre0YNEpVkQ3WTueK6/nxJSeXLbZGzNOcWZ7mQtq/8dxs.', NULL, '2025-02-18 17:58:02', '2025-02-18 17:58:02'),
(9, 0, 0, 'Shekinah Anisette Valdez', 'shekinahvaldesssssz2003@gmail.com', 'customer', '', '', '', NULL, NULL, '$2y$12$m8Qq3PliLkn75j1pQAwCF.yZBxARZNgTqFotZUUqAl8vLDBySqK0G', NULL, '2025-02-18 18:01:09', '2025-02-18 18:01:09'),
(10, 0, 0, 'Shekinah Anisette Valdez', 'shekinahvaldesssssz2s003@gmail.com', 'customer', '', '', '', NULL, NULL, '$2y$12$nZGAiTP3rAHENb92WFmg6uYSTE2Az.TQi2mKWKhM3qOePQjZasy7S', NULL, '2025-02-18 18:02:12', '2025-02-18 18:02:12'),
(11, 0, 0, 'Shekinah Anisette Valdez', 'shekinahvaldesssssz2ss003@gmail.com', 'customer', '', '', '', NULL, NULL, '$2y$12$aMuJXj6ERQG1WZEFv2.r5eEzefFH/Df/xC71vkBj.75zKlEC64PBm', NULL, '2025-02-18 18:02:36', '2025-02-18 18:02:36'),
(12, 0, 0, 'Shekinah Anisette Valdezgffs', 'shekisdfsnahvaldesssssz2ss003@gmail.com', 'customer', '', '', '', NULL, NULL, '$2y$12$kL1wvdPWlQyCOe7DlZj.jOqoHqV80wBf2JSNnrYSzwgbszhM/.5hS', NULL, '2025-02-18 18:05:44', '2025-02-18 18:05:44'),
(13, 0, 0, 'White Screen Door', 'whishekinahvaldez2003@gmail.com', 'customer', '', '', '', NULL, NULL, '$2y$12$LBkmJaCMhypbbEslQDyw3.NrQuYSQWxCm.j5Z1tmaDsJKnHNBoKy2', NULL, '2025-02-18 18:11:55', '2025-02-18 18:11:55'),
(14, 0, 0, 'fsdhgfh', 'dhfgshjd@gmail.com', 'customer', '', '', '', NULL, NULL, '$2y$12$.g0bS.U3tGNF9duuUXz8que6I9cvLlMjjAJq4qD3lf2etKqFPM/Bu', NULL, '2025-02-18 18:26:25', '2025-02-18 18:26:25'),
(15, 0, 0, 'Mark', 'marklua@gmail.com', 'customer', '', '', '', NULL, NULL, '$2y$12$N26srxoJOboq9pqhsREx6eHs8QYmF5D62IXhpkAUpsvsuQsX1smVK', NULL, '2025-02-18 18:31:22', '2025-02-18 18:31:22'),
(16, 53, 200, 'shekinahlollllfgfdhdhfdh valdez', 'popop@gmail.com', 'customer', '1740803517.png', 'Makati City', 'dress to impress2', NULL, NULL, '$2y$12$y9jtJBveJBvyM.6pS8dE0.Ft6QxdyTcciCTPiGQ9ZY4FbYmIeIQb.', NULL, '2025-02-18 19:10:42', '2025-03-05 03:20:44'),
(17, 0, 0, 'Angela', 'angela@gmail.com', 'customer', '', '', '', NULL, NULL, '$2y$12$Xb/3kSZDu/jLKOFHyOdcT.DHyULToEVtPfBviBPQdM9LYOm/BOg6W', NULL, '2025-02-18 19:19:18', '2025-02-18 19:19:18'),
(18, 0, 0, 'Shekinah Valdez', 'shekinahvaldez@gmail.com', 'customer', '1740097279.png', 'Makati', 'Code is fun!', NULL, NULL, '$2y$12$KeBn0TF5dB/xIWMTIKy9vex2XMVfDrEYbxViyqlnbcD8.W2PCoZly', NULL, '2025-02-20 16:20:20', '2025-02-21 00:51:20'),
(19, 0, 0, 'Lolll', 'Lolll@gmail.com', 'customer', '1740297360.png', NULL, NULL, NULL, NULL, '$2y$12$lan90piRvAzkamg6a/138.2.qY0dN1byXqE0BmDdqEf4M/xkPxiMm', NULL, '2025-02-22 19:04:09', '2025-02-22 23:56:00'),
(20, 52, 200, 'Admin2 Admin2', 'shekinahvaldez2003@gmail.com', 'admin', '1741238638_20.png', 'dfsfsgs2', '2afdfda', 'qr_20_1741238638.jpg', NULL, '$2y$12$mPjwhTz2up8KASg9hOwGju.XTeZY8lLvBE497HgsrvN1M4e7tGJfq', NULL, '2025-02-23 00:04:02', '2025-03-05 21:23:58'),
(21, 2, 0, 'Shekinah B.', 'shekinahvaldez063003@gmail.com', 'customer', '1741239849_21.png', 'San Antonio, Naujan, Oriental Mindoro', 'God is Good', NULL, NULL, '$2y$12$MyQOUpUQ368sKFECuD2Hdu7Ggi5eyr4gkDrCzikSRPNMrl3aQDfne', NULL, '2025-02-25 17:24:31', '2025-03-09 02:53:05'),
(22, 0, 0, 'new_admin admin', 'admin@gmail.com', 'admin', '1741522805_22.jpg', NULL, NULL, NULL, NULL, '$2y$12$EfeepOEup8k1RLc1cNu3seOnWZwmowpyhXSprErrtV9m8MCb.KnCK', NULL, '2025-03-08 23:04:15', '2025-03-09 04:20:05');

-- --------------------------------------------------------

--
-- Table structure for table `wishlists`
--

CREATE TABLE `wishlists` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `wishlists`
--

INSERT INTO `wishlists` (`id`, `user_id`, `product_id`, `created_at`, `updated_at`) VALUES
(27, 18, 1, '2025-02-20 16:52:02', '2025-02-20 16:52:02'),
(28, 19, 1, '2025-02-22 22:40:53', '2025-02-22 22:40:53'),
(128, 16, 1, '2025-02-25 06:20:44', '2025-02-25 06:20:44'),
(131, 16, 4, '2025-02-25 06:20:57', '2025-02-25 06:20:57'),
(132, 16, 5, '2025-02-25 06:22:31', '2025-02-25 06:22:31'),
(133, 16, 2, '2025-02-25 06:33:38', '2025-02-25 06:33:38'),
(134, 16, 3, '2025-02-25 06:33:44', '2025-02-25 06:33:44'),
(135, 16, 6, '2025-02-25 06:34:03', '2025-02-25 06:34:03'),
(139, 20, 2, '2025-02-25 16:11:58', '2025-02-25 16:11:58'),
(140, 20, 1, '2025-02-25 18:20:03', '2025-02-25 18:20:03'),
(142, 21, 2, '2025-03-04 06:22:45', '2025-03-04 06:22:45'),
(144, 21, 1, '2025-03-10 16:43:59', '2025-03-10 16:43:59');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bookings_user_id_foreign` (`user_id`),
  ADD KEY `bookings_product_id_foreign` (`product_id`);

--
-- Indexes for table `chats`
--
ALTER TABLE `chats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `chats_user_id_foreign` (`user_id`),
  ADD KEY `chats_receiver_id_foreign` (`receiver_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD KEY `favorites_user_id_foreign` (`user_id`),
  ADD KEY `favorites_product_id_foreign` (`product_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `oauth_access_tokens`
--
ALTER TABLE `oauth_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `oauth_access_tokens_user_id_index` (`user_id`);

--
-- Indexes for table `oauth_auth_codes`
--
ALTER TABLE `oauth_auth_codes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `oauth_auth_codes_user_id_index` (`user_id`);

--
-- Indexes for table `oauth_clients`
--
ALTER TABLE `oauth_clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `oauth_clients_user_id_index` (`user_id`);

--
-- Indexes for table `oauth_personal_access_clients`
--
ALTER TABLE `oauth_personal_access_clients`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `oauth_refresh_tokens`
--
ALTER TABLE `oauth_refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `oauth_refresh_tokens_access_token_id_index` (`access_token_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reviews_product_id_foreign` (`product_id`),
  ADD KEY `reviews_user_id_foreign` (`user_id`);

--
-- Indexes for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_adjustments_product_id_foreign` (`product_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`student_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- Indexes for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `wishlists_user_id_foreign` (`user_id`),
  ADD KEY `wishlists_product_id_foreign` (`product_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `chats`
--
ALTER TABLE `chats`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `oauth_clients`
--
ALTER TABLE `oauth_clients`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `oauth_personal_access_clients`
--
ALTER TABLE `oauth_personal_access_clients`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `student_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `wishlists`
--
ALTER TABLE `wishlists`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=145;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chats`
--
ALTER TABLE `chats`
  ADD CONSTRAINT `chats_receiver_id_foreign` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chats_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  ADD CONSTRAINT `stock_adjustments_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD CONSTRAINT `wishlists_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlists_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
