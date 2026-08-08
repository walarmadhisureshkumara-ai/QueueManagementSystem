-- Queue Management System Database

CREATE TABLE STAFF (
    staff_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50)
);

CREATE TABLE CUSTOMERS (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20)
);

CREATE TABLE COUNTERS (
    counter_id INT PRIMARY KEY AUTO_INCREMENT,
    counter_name VARCHAR(50),
    location VARCHAR(100),
    description TEXT,
    status VARCHAR(20),
    staff_id INT,
    FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id)
);

CREATE TABLE TOKEN_TYPES (
    token_type_id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(50),
    description TEXT
);

CREATE TABLE TOKENS (
    token_id INT PRIMARY KEY AUTO_INCREMENT,
    token_number VARCHAR(20),
    created_at DATETIME,
    customer_id INT,
    counter_id INT,
    token_type_id INT,
    staff_id INT,
    FOREIGN KEY (customer_id) REFERENCES CUSTOMERS(customer_id),
    FOREIGN KEY (counter_id) REFERENCES COUNTERS(counter_id),
    FOREIGN KEY (token_type_id) REFERENCES TOKEN_TYPES(token_type_id),
    FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id)
);

CREATE TABLE TOKEN_CALLS (
    call_id INT PRIMARY KEY AUTO_INCREMENT,
    token_id INT,
    staff_id INT,
    counter_id INT,
    call_time DATETIME,
    call_type VARCHAR(50),
    remarks TEXT,
    FOREIGN KEY (token_id) REFERENCES TOKENS(token_id),
    FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id),
    FOREIGN KEY (counter_id) REFERENCES COUNTERS(counter_id)
);

CREATE TABLE TOKEN_STATUS (
    status_id INT PRIMARY KEY AUTO_INCREMENT,
    token_id INT,
    status VARCHAR(50),
    status_time DATETIME,
    remarks TEXT,
    FOREIGN KEY (token_id) REFERENCES TOKENS(token_id)
);

CREATE TABLE NOTIFICATIONS (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    token_id INT,
    message TEXT,
    notification_time DATETIME,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (token_id) REFERENCES TOKENS(token_id)
);

CREATE TABLE ACTIVITY_LOGS (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT,
    action VARCHAR(100),
    details TEXT,
    log_time DATETIME,
    FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id)
);