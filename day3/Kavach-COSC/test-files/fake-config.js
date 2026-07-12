// THIS FILE IS INTENTIONALLY FULL OF FAKE SECRETS FOR TESTING
// DO NOT USE ANY OF THESE VALUES — THEY ARE ALL FAKE

const config = {
  // aws stuff (fake)
  aws_access_key: "AKIAIOSFODNN7EXAMPLE",
  aws_secret_access_key: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",

  // database (fake)
  db_url: "mongodb://admin:supersecretpass123@db.example.com:27017/production",
  postgres_url: "postgres://user:p4ssw0rd@10.0.0.5:5432/maindb",

  // api keys (fake - changed to avoid github push protection)
  api_key: "my_fake_api_key_abcdef1234567890abcd",
  stripe_key: "FAKE_stripe_test_key_placeholder_value",
  google_api: "AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe",

  // auth tokens (fake)
  github_token: "ghp_FAKE_TOKEN_PLACEHOLDER_1234567890abcde",

  // passwords (fake)
  password: "MySuper$ecretP@ss2024!",
  smtp_password: "emailpassword123",

  // slack (fake - modified for github push protection)
  slack_webhook: "https://hooks.example.com/services/TXXXXXXXX/BXXXXXXXX/fake_webhook_placeholder",

  // additional fake credentials
  heroku_api_key: "01234567-89ab-cdef-0123-456789abcdef",
  sendgrid_key: "SG.fake1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr",
  twilio_key: "SK1234567890abcdef1234567890abcdef12345678",
  bearer_token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.token.payload.here",
  generic_secret: "secret_key=my_super_secret_value_12345",
  redis_url: "redis://:password@redis.example.com:6379/0",
  mysql_url: "mysql://root:dbpassword@mysql.example.com:3306/mydb",
};

// private key example (fake)
const key = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/yGaXxw
-----END RSA PRIVATE KEY-----`;

// hardcoded server
const server = "192.168.1.100:8080";
const backup_server = "10.20.30.40:9000";

module.exports = config;
