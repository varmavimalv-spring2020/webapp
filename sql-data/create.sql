DROP TABLE IF EXISTS `UsersData`;

CREATE TABLE `UsersData` (
  `id` varchar(100) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `email_address` varchar(100) NOT NULL,
  `account_created` timestamp(6) NOT NULL DEFAULT '0000-00-00 00:00:00.000000',
  `account_updated` timestamp(6) NOT NULL DEFAULT '0000-00-00 00:00:00.000000',
  PRIMARY KEY (`id`)
);
