--
-- PLANNING
--
-- We start with a plan
CREATE TABLE IF NOT EXISTS training_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  training_day_1 TEXT NOT NULL CHECK(training_day_1 IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  training_day_2 TEXT NOT NULL CHECK(training_day_2 IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  training_day_3 TEXT NOT NULL CHECK(training_day_3 IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  training_day_4 TEXT CHECK(training_day_4 IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')), -- May be null if we train three days a week
  lift_day_1_id INTEGER NOT NULL,
  lift_day_2_id INTEGER NOT NULL,
  lift_day_3_id INTEGER NOT NULL,
  lift_day_4_id INTEGER, -- May be null if we train three days a week
  goals TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  comleted_date DATE,
  FOREIGN KEY (lift_day_1_id) REFERENCES lifts(id),
  FOREIGN KEY (lift_day_2_id) REFERENCES lifts(id),
  FOREIGN KEY (lift_day_3_id) REFERENCES lifts(id),
  FOREIGN KEY (lift_day_4_id) REFERENCES lifts(id)
);

INSERT INTO training_blocks (name, training_day_1, training_day_2, training_day_3, training_day_4, lift_day_1_id, lift_day_2_id, lift_day_3_id, lift_day_4_id, goals)
VALUES ('Begynnelse 2025', 'monday', 'tuesday','thursday', 'friday', (SELECT id from lifts where name = 'Squat'), (SELECT id from lifts where name = 'Bench Press'), (SELECT id from lifts where name = 'Overhead Press'), (SELECT id from lifts where name = 'Deadlift'), 'Følge meg bra i musklene');

-- a Training block consists of multiple cycles.
-- Usually in a 2 leader, 1 anchor cycles, where there is a "7th week" between leader and anchor cycles
CREATE TABLE IF NOT EXISTS cycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_id INTEGER,
    cycle_number_in_block INTEGER NOT NULL, -- The order in the traning block
    cycle_type TEXT NOT NULL CHECK(cycle_type IN ('leader', 'anchor', '7th week')),
    seventh_week_template_id INTEGER, -- If 7th week we reference the type of implementation
    supplemental_template_id INTEGER,
    start_date DATE NOT NULL,
    end_date DATE,
    completed_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (block_id) REFERENCES training_blocks(id),
    FOREIGN KEY (seventh_week_template_id) REFERENCES week_templates(id),
    FOREIGN KEY (supplemental_template_id) REFERENCES supplemental_templates(id)
);

-- END PLANNING
--
-- START DOING

-- one cycle consists of multiple workout sessions
-- 3-4 per week
CREATE TABLE IF NOT EXISTS workout_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cycle_id INTEGER NOT NULL,
    lift_id INTEGER NOT NULL,
    week_number_in_cycle INTEGER NOT NULL CHECK(week_number_in_cycle BETWEEN 1 and 3),
    week_template_id INTEGER NOT NULL, -- 5 / 3 / 1 / TM test etc
    planned_date DATE NOT NULL,
    completed_date DATE,
    status TEXT DEFAULT 'planned' CHECK(status IN ('planned', 'completed', 'skipped')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cycle_id) REFERENCES cycles(id),
    FOREIGN KEY (lift_id) REFERENCES lifts(id),
    FOREIGN KEY (week_template_id) REFERENCES week_templates(id)
);

CREATE INDEX idx_workout_sessions_date ON workout_sessions(planned_date);
