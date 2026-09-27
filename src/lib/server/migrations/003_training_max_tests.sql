-- A heavy set done to estimate a one rep max, e.g. when restarting or before a new block.
-- The training max is stored as calculated when the test was logged.
CREATE TABLE training_max_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lift_id INTEGER NOT NULL,
  test_date DATE NOT NULL,
  weight REAL NOT NULL CHECK(weight > 0),
  reps INTEGER NOT NULL CHECK(reps BETWEEN 1 AND 10),
  training_max REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lift_id) REFERENCES lifts(id)
);

CREATE INDEX idx_training_max_tests_lift ON training_max_tests(lift_id, test_date);
