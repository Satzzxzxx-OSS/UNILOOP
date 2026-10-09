-- ================================================================
--  UniLoop — Complete Database Schema  |  SQL Server (T-SQL)
--  Includes: Core tables + Authentication
--  Safe to re-run: drops everything first, then rebuilds clean.
--
--  TABLES (17)
--  Core       : universities, users, categories, listings,
--               listing_images, saved_listings, conversations,
--               messages, reviews, reports, search_tags
--  Auth       : user_auth, otp_codes, password_resets,
--               user_sessions, login_attempts, oauth_accounts
--
--  VIEWS  (4) : v_active_listings, v_category_counts,
--               v_session_user, v_recent_failures
-- ================================================================


-- ================================================================
--  SECTION 0 — TEARDOWN
--  Drop views first, then auth tables, then core tables.
--  Reverse FK order throughout — no CASCADE in SQL Server.
-- ================================================================

-- Views
IF OBJECT_ID('v_recent_failures', 'V') IS NOT NULL DROP VIEW v_recent_failures;
IF OBJECT_ID('v_session_user',    'V') IS NOT NULL DROP VIEW v_session_user;
IF OBJECT_ID('v_category_counts', 'V') IS NOT NULL DROP VIEW v_category_counts;
IF OBJECT_ID('v_active_listings', 'V') IS NOT NULL DROP VIEW v_active_listings;

-- Auth tables (depend on users)
IF OBJECT_ID('login_attempts',  'U') IS NOT NULL DROP TABLE login_attempts;
IF OBJECT_ID('oauth_accounts',  'U') IS NOT NULL DROP TABLE oauth_accounts;
IF OBJECT_ID('user_sessions',   'U') IS NOT NULL DROP TABLE user_sessions;
IF OBJECT_ID('password_resets', 'U') IS NOT NULL DROP TABLE password_resets;
IF OBJECT_ID('otp_codes',       'U') IS NOT NULL DROP TABLE otp_codes;
IF OBJECT_ID('user_auth',       'U') IS NOT NULL DROP TABLE user_auth;

-- Core tables (reverse FK order)
IF OBJECT_ID('search_tags',     'U') IS NOT NULL DROP TABLE search_tags;
IF OBJECT_ID('reports',         'U') IS NOT NULL DROP TABLE reports;
IF OBJECT_ID('reviews',         'U') IS NOT NULL DROP TABLE reviews;
IF OBJECT_ID('messages',        'U') IS NOT NULL DROP TABLE messages;
IF OBJECT_ID('conversations',   'U') IS NOT NULL DROP TABLE conversations;
IF OBJECT_ID('saved_listings',  'U') IS NOT NULL DROP TABLE saved_listings;
IF OBJECT_ID('listing_images',  'U') IS NOT NULL DROP TABLE listing_images;
IF OBJECT_ID('listings',        'U') IS NOT NULL DROP TABLE listings;
IF OBJECT_ID('categories',      'U') IS NOT NULL DROP TABLE categories;
IF OBJECT_ID('users',           'U') IS NOT NULL DROP TABLE users;
IF OBJECT_ID('universities',    'U') IS NOT NULL DROP TABLE universities;
GO


-- ================================================================
--  SECTION 1 — CORE TABLES
-- ================================================================

-- ----------------------------------------------------------------
--  TABLE 1 — UNIVERSITIES
--  Future-proof: other campuses can be added later.
-- ----------------------------------------------------------------
CREATE TABLE universities (
    id          INT          IDENTITY(1,1) PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    short_name  VARCHAR(20)  NOT NULL UNIQUE,   -- e.g. 'DEMO'
    city        VARCHAR(80),
    state       VARCHAR(80),
    country     VARCHAR(80)  NOT NULL DEFAULT 'India',
    is_active   BIT          NOT NULL DEFAULT 1,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
GO

INSERT INTO universities (name, short_name, city, state)
VALUES ('Example University', 'DEMO', 'Phagwara', 'Punjab');
GO


-- ----------------------------------------------------------------
--  TABLE 2 — USERS  (students)
-- ----------------------------------------------------------------
CREATE TABLE users (
    id            INT          IDENTITY(1,1) PRIMARY KEY,
    university_id INT          NOT NULL REFERENCES universities(id),
    full_name     VARCHAR(100) NOT NULL,
    lpu_reg_no    VARCHAR(20)  NULL,             -- unique enforced by filtered index
    email         VARCHAR(150) NOT NULL UNIQUE,
    phone         VARCHAR(15)  NULL,
    avatar_url    VARCHAR(MAX) NULL,
    hostel_block  VARCHAR(10)  NULL,             -- e.g. 'H-6', 'GH-2'
    bio           VARCHAR(200) NULL,
    is_verified   BIT          NOT NULL DEFAULT 0,
    is_active     BIT          NOT NULL DEFAULT 1,
    total_sold    INT          NOT NULL DEFAULT 0,
    total_bought  INT          NOT NULL DEFAULT 0,
    avg_rating    DECIMAL(2,1) NOT NULL DEFAULT 0.0
                      CHECK (avg_rating BETWEEN 0.0 AND 5.0),
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
GO

-- Allows multiple NULLs but no duplicate registration numbers
CREATE UNIQUE INDEX uq_users_lpu_reg_no
    ON users (lpu_reg_no)
    WHERE lpu_reg_no IS NOT NULL;
GO

INSERT INTO users (university_id, full_name, lpu_reg_no, email, hostel_block, is_verified)
VALUES
    (1, 'Aarav Sharma',  '12307641', 'aarav.sharma@example.invalid',  'H-4',  1),
    (1, 'Priya Nair',    '12307642', 'priya.nair@example.invalid',    'GH-2', 1),
    (1, 'Rohan Verma',   '12307643', 'rohan.verma@example.invalid',   'H-6',  1),
    (1, 'Sneha Kapoor',  '12307644', 'sneha.kapoor@example.invalid',  'GH-1', 1);
GO


-- ----------------------------------------------------------------
--  TABLE 3 — CATEGORIES
--  Matches every category shown on the landing page.
-- ----------------------------------------------------------------
CREATE TABLE categories (
    id         INT         IDENTITY(1,1) PRIMARY KEY,
    name       VARCHAR(80) NOT NULL UNIQUE,
    slug       VARCHAR(80) NOT NULL UNIQUE,   -- URL-safe identifier
    icon       VARCHAR(50) NULL,              -- Tabler icon name
    icon_color CHAR(7)     NULL,              -- hex e.g. '#2563EB'
    bg_color   CHAR(7)     NULL,              -- icon background hex
    sort_order SMALLINT    NOT NULL DEFAULT 0,
    is_active  BIT         NOT NULL DEFAULT 1,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
GO

INSERT INTO categories (name, slug, icon, icon_color, bg_color, sort_order)
VALUES
    ('Books',        'books',        'ti-books',         '#2563EB', '#EFF6FF', 1),
    ('Electronics',  'electronics',  'ti-device-laptop', '#7C3AED', '#F5F3FF', 2),
    ('Clothes',      'clothes',      'ti-shirt',         '#DB2777', '#FDF2F8', 3),
    ('Hostel Items', 'hostel-items', 'ti-home',          '#D97706', '#FFFBEB', 4),
    ('Study',        'study',        'ti-school',        '#16A34A', '#F0FDF4', 5),
    ('Accessories',  'accessories',  'ti-headphones',    '#E11D48', '#FFF1F2', 6),
    ('Others',       'others',       'ti-grid-dots',     '#6B7280', '#F3F4F6', 7);
GO


-- ----------------------------------------------------------------
--  TABLE 4 — LISTINGS  (core entity)
--  No ENUM in SQL Server — use VARCHAR + CHECK constraint.
-- ----------------------------------------------------------------
CREATE TABLE listings (
    id            INT           IDENTITY(1,1) PRIMARY KEY,
    seller_id     INT           NOT NULL REFERENCES users(id),
    buyer_id      INT           NULL     REFERENCES users(id),  -- set when sold
    category_id   INT           NOT NULL REFERENCES categories(id),
    title         VARCHAR(120)  NOT NULL,
    description   VARCHAR(MAX)  NULL,
    price         DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    is_negotiable BIT           NOT NULL DEFAULT 0,
    condition     VARCHAR(10)   NOT NULL
                      CHECK (condition IN ('Like New','Good','Used','For Parts')),
    status        VARCHAR(10)   NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','sold','reserved','removed')),
    views         INT           NOT NULL DEFAULT 0,
    saves         INT           NOT NULL DEFAULT 0,
    sold_at       DATETIME      NULL,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);
GO

-- Sample listings from the landing page cards
INSERT INTO listings
    (seller_id, category_id, title, description, price, is_negotiable, condition, status)
VALUES
    (1, 2, 'HP Pavilion 15 Laptop',
     '8GB RAM, 512GB SSD, Intel i5 11th Gen. Used for 1 year. Charger included.',
     25000.00, 1, 'Good', 'active'),

    (2, 1, 'DBMS Textbook (Navathe)',
     'Database System Concepts by Navathe. Barely used, no highlights.',
     250.00, 0, 'Like New', 'active'),

    (3, 2, 'Casio Scientific Calculator',
     'Casio FX-991ES Plus. Works perfectly, minor scratches on back.',
     500.00, 0, 'Good', 'active'),

    (4, 4, 'Study Table + Chair',
     'Foldable study table 90cm x 50cm with matching plastic chair. Moving out.',
     1200.00, 1, 'Used', 'active');
GO


-- ----------------------------------------------------------------
--  TABLE 5 — LISTING IMAGES
-- ----------------------------------------------------------------
CREATE TABLE listing_images (
    id          INT          IDENTITY(1,1) PRIMARY KEY,
    listing_id  INT          NOT NULL REFERENCES listings(id),
    image_url   VARCHAR(MAX) NOT NULL,
    is_primary  BIT          NOT NULL DEFAULT 0,
    sort_order  SMALLINT     NOT NULL DEFAULT 0,
    uploaded_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
GO


-- ----------------------------------------------------------------
--  TABLE 6 — SAVED LISTINGS  (student wishlist / bookmarks)
-- ----------------------------------------------------------------
CREATE TABLE saved_listings (
    user_id    INT      NOT NULL REFERENCES users(id),
    listing_id INT      NOT NULL REFERENCES listings(id),
    saved_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, listing_id)
);
GO


-- ----------------------------------------------------------------
--  TABLE 7 — CONVERSATIONS  (one thread per listing × buyer)
-- ----------------------------------------------------------------
CREATE TABLE conversations (
    id              INT      IDENTITY(1,1) PRIMARY KEY,
    listing_id      INT      NOT NULL REFERENCES listings(id),
    buyer_id        INT      NOT NULL REFERENCES users(id),
    seller_id       INT      NOT NULL REFERENCES users(id),
    last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (listing_id, buyer_id)
);
GO


-- ----------------------------------------------------------------
--  TABLE 8 — MESSAGES
-- ----------------------------------------------------------------
CREATE TABLE messages (
    id              INT          IDENTITY(1,1) PRIMARY KEY,
    conversation_id INT          NOT NULL REFERENCES conversations(id),
    sender_id       INT          NOT NULL REFERENCES users(id),
    body            VARCHAR(MAX) NOT NULL,
    is_read         BIT          NOT NULL DEFAULT 0,
    sent_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
GO


-- ----------------------------------------------------------------
--  TABLE 9 — REVIEWS  (posted after a sale completes)
-- ----------------------------------------------------------------
CREATE TABLE reviews (
    id          INT          IDENTITY(1,1) PRIMARY KEY,
    listing_id  INT          NOT NULL REFERENCES listings(id),
    reviewer_id INT          NOT NULL REFERENCES users(id),
    reviewee_id INT          NOT NULL REFERENCES users(id),
    rating      SMALLINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     VARCHAR(500) NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (listing_id, reviewer_id)
);
GO


-- ----------------------------------------------------------------
--  TABLE 10 — REPORTS  (flag bad listings / users)
-- ----------------------------------------------------------------
CREATE TABLE reports (
    id            INT         IDENTITY(1,1) PRIMARY KEY,
    reporter_id   INT         NOT NULL REFERENCES users(id),
    listing_id    INT         NULL     REFERENCES listings(id),
    reported_user INT         NULL     REFERENCES users(id),
    reason        VARCHAR(20) NOT NULL
                      CHECK (reason IN (
                          'spam','fake_item','wrong_price',
                          'offensive','already_sold','other')),
    details       VARCHAR(500) NULL,
    is_resolved   BIT          NOT NULL DEFAULT 0,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
GO


-- ----------------------------------------------------------------
--  TABLE 11 — SEARCH TAGS
--  Powers the "Popular:" chips on the hero section.
-- ----------------------------------------------------------------
CREATE TABLE search_tags (
    id           INT         IDENTITY(1,1) PRIMARY KEY,
    tag          VARCHAR(50) NOT NULL UNIQUE,
    search_count INT         NOT NULL DEFAULT 0,
    is_featured  BIT         NOT NULL DEFAULT 0,
    created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
GO

INSERT INTO search_tags (tag, search_count, is_featured)
VALUES
    ('DBMS book',  120, 1),
    ('laptop',     340, 1),
    ('calculator',  89, 1),
    ('fan',         73, 1);
GO


-- ================================================================
--  SECTION 2 — AUTHENTICATION TABLES
-- ================================================================

-- ----------------------------------------------------------------
--  TABLE 12 — USER_AUTH
--  Hashed password only. Never store plain-text passwords.
--  Hash with bcrypt in your app before inserting.
-- ----------------------------------------------------------------
CREATE TABLE user_auth (
    id            INT          IDENTITY(1,1) PRIMARY KEY,
    user_id       INT          NOT NULL UNIQUE REFERENCES users(id),
    password_hash VARCHAR(255) NOT NULL,       -- bcrypt hash (~60 chars)
    must_reset    BIT          NOT NULL DEFAULT 0,  -- force reset on next login
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
GO


-- ----------------------------------------------------------------
--  TABLE 13 — OTP_CODES
--  6-digit codes for email verify, phone verify, login, password reset.
-- ----------------------------------------------------------------
CREATE TABLE otp_codes (
    id         INT          IDENTITY(1,1) PRIMARY KEY,
    user_id    INT          NULL REFERENCES users(id),  -- NULL before account created
    email      VARCHAR(150) NOT NULL,
    otp_hash   VARCHAR(255) NOT NULL,   -- always hash the code; never store plain
    otp_type   VARCHAR(20)  NOT NULL
                   CHECK (otp_type IN (
                       'email_verify',   -- new account email confirmation
                       'phone_verify',   -- phone number confirmation
                       'login',          -- OTP-based passwordless login
                       'password_reset'  -- forgot password flow
                   )),
    expires_at DATETIME     NOT NULL,
    is_used    BIT          NOT NULL DEFAULT 0,
    attempts   TINYINT      NOT NULL DEFAULT 0,  -- wrong guesses; lock after 5
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
GO

CREATE INDEX idx_otp_email_type ON otp_codes (email, otp_type, is_used);
GO


-- ----------------------------------------------------------------
--  TABLE 14 — PASSWORD_RESETS
--  Secure single-use token emailed to the user. Expires in 30 min.
-- ----------------------------------------------------------------
CREATE TABLE password_resets (
    id           INT          IDENTITY(1,1) PRIMARY KEY,
    user_id      INT          NOT NULL REFERENCES users(id),
    token_hash   VARCHAR(255) NOT NULL,   -- SHA-256 of URL token; never store plain
    expires_at   DATETIME     NOT NULL,
    is_used      BIT          NOT NULL DEFAULT 0,
    ip_requested VARCHAR(45)  NULL,       -- IP that triggered the reset request
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
GO

CREATE INDEX idx_pwreset_user ON password_resets (user_id, is_used);
GO


-- ----------------------------------------------------------------
--  TABLE 15 — USER_SESSIONS
--  One row per active login (web / Android / iOS).
--  Issue short-lived JWTs in your app; store the refresh token here.
-- ----------------------------------------------------------------
CREATE TABLE user_sessions (
    id             INT          IDENTITY(1,1) PRIMARY KEY,
    user_id        INT          NOT NULL REFERENCES users(id),
    refresh_token  VARCHAR(255) NOT NULL UNIQUE,    -- hashed opaque token
    device_name    VARCHAR(100) NULL,               -- e.g. 'Chrome on Windows'
    device_type    VARCHAR(10)  NULL
                       CHECK (device_type IN ('web','android','ios','other')),
    ip_address     VARCHAR(45)  NULL,
    last_active_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at     DATETIME     NOT NULL,
    is_revoked     BIT          NOT NULL DEFAULT 0,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
GO

CREATE INDEX idx_sessions_user    ON user_sessions (user_id, is_revoked);
CREATE INDEX idx_sessions_expires ON user_sessions (expires_at)
    WHERE is_revoked = 0;
GO


-- ----------------------------------------------------------------
--  TABLE 16 — LOGIN_ATTEMPTS
--  Every attempt logged for rate-limiting and brute-force detection.
-- ----------------------------------------------------------------
CREATE TABLE login_attempts (
    id             INT          IDENTITY(1,1) PRIMARY KEY,
    email          VARCHAR(150) NOT NULL,
    ip_address     VARCHAR(45)  NOT NULL,
    is_success     BIT          NOT NULL DEFAULT 0,
    failure_reason VARCHAR(50)  NULL
                       CHECK (failure_reason IN (
                           'wrong_password',
                           'wrong_otp',
                           'account_inactive',
                           'unverified_email',
                           'too_many_attempts',
                           NULL
                       )),
    attempted_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
GO

CREATE INDEX idx_attempts_email_time ON login_attempts (email,      attempted_at DESC);
CREATE INDEX idx_attempts_ip_time    ON login_attempts (ip_address, attempted_at DESC);
GO


-- ----------------------------------------------------------------
--  TABLE 17 — OAUTH_ACCOUNTS
--  Social login — Google (DEMO uses Google Workspace), Microsoft, GitHub.
--  One user can link multiple providers.
-- ----------------------------------------------------------------
CREATE TABLE oauth_accounts (
    id               INT          IDENTITY(1,1) PRIMARY KEY,
    user_id          INT          NOT NULL REFERENCES users(id),
    provider         VARCHAR(20)  NOT NULL
                         CHECK (provider IN ('google','microsoft','github')),
    provider_user_id VARCHAR(100) NOT NULL,   -- unique ID from the OAuth provider
    email            VARCHAR(150) NOT NULL,
    access_token     VARCHAR(MAX) NULL,       -- encrypt at the app level
    refresh_token    VARCHAR(MAX) NULL,
    token_expires_at DATETIME     NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (provider, provider_user_id)
);
GO


-- ================================================================
--  SECTION 3 — INDEXES
-- ================================================================

-- Core listings
CREATE INDEX idx_listings_category  ON listings (category_id);
CREATE INDEX idx_listings_seller    ON listings (seller_id);
CREATE INDEX idx_listings_status    ON listings (status);
CREATE INDEX idx_listings_condition ON listings (condition);
CREATE INDEX idx_listings_created   ON listings (created_at DESC);
CREATE INDEX idx_listings_price     ON listings (price);

-- Messages
CREATE INDEX idx_messages_convo     ON messages (conversation_id, sent_at DESC);
CREATE INDEX idx_messages_unread    ON messages (sender_id) WHERE is_read = 0;

-- Wishlist
CREATE INDEX idx_saved_user         ON saved_listings (user_id);

-- Search tags
CREATE INDEX idx_tags_count         ON search_tags (search_count DESC);
GO


-- ================================================================
--  SECTION 4 — VIEWS
--  Each CREATE VIEW must be the first statement in its batch.
-- ================================================================

-- Active listings — Browse / home page feed
GO
CREATE VIEW v_active_listings AS
SELECT
    l.id,
    l.title,
    l.price,
    l.is_negotiable,
    l.condition,
    l.views,
    l.saves,
    l.created_at,
    c.name         AS category,
    c.slug         AS category_slug,
    c.icon         AS category_icon,
    u.full_name    AS seller_name,
    u.hostel_block AS seller_hostel,
    u.avg_rating   AS seller_rating,
    u.total_sold   AS seller_total_sold
FROM  listings   l
JOIN  categories c ON c.id = l.category_id
JOIN  users      u ON u.id = l.seller_id
WHERE l.status = 'active';
GO


-- Category badge counts — Browse page
GO
CREATE VIEW v_category_counts AS
SELECT
    c.id,
    c.name,
    c.slug,
    c.icon,
    c.icon_color,
    c.bg_color,
    c.sort_order,
    COUNT(l.id) AS active_listings
FROM  categories c
LEFT JOIN listings l
       ON l.category_id = c.id
      AND l.status = 'active'
WHERE c.is_active = 1
GROUP BY
    c.id, c.name, c.slug, c.icon,
    c.icon_color, c.bg_color, c.sort_order;
GO


-- Validate a refresh token and return the full user in one query
GO
CREATE VIEW v_session_user AS
SELECT
    s.refresh_token,
    s.expires_at       AS session_expires,
    s.is_revoked,
    s.device_type,
    s.last_active_at,
    u.id               AS user_id,
    u.full_name,
    u.email,
    u.lpu_reg_no,
    u.hostel_block,
    u.is_verified,
    u.is_active,
    u.avg_rating,
    a.must_reset       AS must_reset_password
FROM  user_sessions s
JOIN  users         u ON u.id  = s.user_id
JOIN  user_auth     a ON a.user_id = u.id
WHERE s.is_revoked = 0
  AND s.expires_at > CURRENT_TIMESTAMP;
GO


-- Recent failures per email in last 15 min — plug into your rate-limiter
GO
CREATE VIEW v_recent_failures AS
SELECT
    email,
    ip_address,
    COUNT(*)          AS failure_count,
    MAX(attempted_at) AS last_attempt
FROM  login_attempts
WHERE is_success = 0
  AND attempted_at >= DATEADD(MINUTE, -15, CURRENT_TIMESTAMP)
GROUP BY email, ip_address;
GO


-- ================================================================
--  AUTH FLOW REFERENCE
-- ================================================================
--
--  REGISTER
--    1. INSERT users        → (name, email, lpu_reg_no, hostel_block ...)
--    2. INSERT user_auth    → (user_id, password_hash)   ← bcrypt in app
--    3. INSERT otp_codes    → (otp_type='email_verify', expires_at=now+10min)
--    4. Email OTP → user enters code → is_used=1, users.is_verified=1
--
--  LOGIN (password)
--    1. SELECT user_auth WHERE users.email = ?
--    2. bcrypt.compare(inputPassword, password_hash)
--    3. Success → INSERT user_sessions; INSERT login_attempts (is_success=1)
--       Failure → INSERT login_attempts (is_success=0, failure_reason)
--              → query v_recent_failures; block if failure_count >= 5
--
--  LOGIN (OTP / passwordless)
--    1. INSERT otp_codes (otp_type='login', expires_at=now+10min)
--    2. Email OTP → user submits → verify hash, check attempts < 5 & expiry
--    3. Mark is_used=1 → INSERT user_sessions
--
--  FORGOT PASSWORD
--    1. INSERT password_resets (token_hash, expires_at=now+30min)
--    2. Email link → user clicks → verify token_hash, check is_used=0
--    3. UPDATE user_auth SET password_hash = newHash, updated_at = now
--    4. UPDATE password_resets SET is_used = 1
--    5. UPDATE user_sessions SET is_revoked = 1  ← logs out all devices
--
--  LOGOUT (single device)
--    UPDATE user_sessions SET is_revoked = 1 WHERE refresh_token = ?
--
--  TOKEN REFRESH
--    SELECT * FROM v_session_user WHERE refresh_token = ?
--    → issue a new short-lived JWT in your app layer
--
-- ================================================================
--  Done. 17 tables + 4 views created for UniLoop.
-- ================================================================
