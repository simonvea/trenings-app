-- Core lifts (Squat, Bench Press, Deadlift, Overhead Press)
CREATE TABLE lifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  current_training_max REAL NOT NULL,
  one_rep_max REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO lifts (name, current_training_max, one_rep_max) VALUES
  ('Squat', 0, 0),
  ('Bench Press', 0, 0),
  ('Deadlift', 0, 0),
  ('Overhead Press', 0, 0);

CREATE TABLE training_max_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lift_id INTEGER NOT NULL,
  training_max REAL NOT NULL,
  effective_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lift_id) REFERENCES lifts(id)
);

CREATE TABLE assistance_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category TEXT, -- 'push', 'pull', 'legs/core'
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO assistance_exercises (name, category, description) VALUES
  ('Barbell Row', 'pull', 'Main pulling movement'),
  ('Pull-ups/Chin-ups', 'pull', 'Bodyweight pull'),
  ('Face Pulls', 'pull', 'Rear delt/upper back'),
  ('Dumbbell Row', 'pull', 'Unilateral pulling'),
  ('Dips', 'push', 'Bodyweight push'),
  ('Dumbbell Bench Press', 'push', 'Horizontal push'),
  ('Incline Press', 'push', 'Upper chest focus'),
  ('Tricep Extensions', 'push', 'Tricep isolation'),
  ('Leg Press', 'legs/core', 'Quad dominant'),
  ('Romanian Deadlift', 'legs/core', 'Hamstring/glute focus'),
  ('Lunges', 'legs/core', 'Unilateral leg work'),
  ('Leg Curls', 'legs/core', 'Hamstring isolation'),
  ('Abs/Core Work', 'legs/core', 'Various ab exercises'),
  ('Back Extensions', 'legs/core', 'Lower back/glute'),
  ('Good Morning', 'legs/core', 'Hamstring/lower back'),
  ('Hanging Leg Raise', 'legs/core', 'Abs');

-- Week 1: 5+, Week 2: 3+, Week 3: 5/3/1+, Week 4 ("7th week"): Deload / TM Test / PR
CREATE TABLE week_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_number INTEGER NOT NULL CHECK(week_number BETWEEN 1 AND 4),
  name TEXT NOT NULL,
  warmup_set_1_percentage REAL,
  warmup_set_1_reps INTEGER,
  warmup_set_2_percentage REAL,
  warmup_set_2_reps INTEGER,
  warmup_set_3_percentage REAL,
  warmup_set_3_reps INTEGER,
  set_1_percentage REAL NOT NULL,
  set_1_reps INTEGER NOT NULL,
  set_2_percentage REAL NOT NULL,
  set_2_reps INTEGER NOT NULL,
  set_3_percentage REAL NOT NULL,
  set_3_reps INTEGER NOT NULL, -- negative means AMRAP (as many reps as possible)
  set_4_percentage REAL, -- only applicable for "7th week"
  set_4_reps INTEGER
);

INSERT INTO week_templates (week_number, name, warmup_set_1_percentage, warmup_set_1_reps, warmup_set_2_percentage, warmup_set_2_reps, warmup_set_3_percentage, warmup_set_3_reps, set_1_percentage, set_1_reps, set_2_percentage, set_2_reps, set_3_percentage, set_3_reps, set_4_percentage, set_4_reps) VALUES
  (1, '5+', 0.40, 5, 0.50, 5, 0.60, 5, 0.65, 5, 0.75, 5, 0.85, -5, NULL, NULL),
  (2, '3+', 0.40, 5, 0.50, 5, 0.60, 5, 0.70, 3, 0.80, 3, 0.90, -3, NULL, NULL),
  (3, '5/3/1+', 0.40, 5, 0.50, 5, 0.60, 5, 0.75, 5, 0.85, 3, 0.95, -1, NULL, NULL),
  (4, 'Deload', 0.40, 5, 0.50, 5, 0.60, 5, 0.70, 5, 0.80, 5, 0.90, 1, 1, 1),
  (4, 'TM Test', 0.40, 5, 0.50, 5, 0.60, 5, 0.70, 5, 0.80, 5, 0.90, 5, 1, 5),
  (4, 'PR', 0.40, 5, 0.50, 5, 0.60, 5, 0.70, 5, 0.80, 5, 0.90, 5, 1, -3);

CREATE TABLE supplemental_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_calculation TEXT NOT NULL CHECK(weight_calculation IN ('first_set', 'second_set', 'fixed_percentage', 'custom')),
  fixed_percentage REAL, -- used when weight_calculation = 'fixed_percentage'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO supplemental_templates (name, description, sets, reps, weight_calculation, fixed_percentage, notes) VALUES
  ('FSL', 'First Set Last', 5, 5, 'first_set', NULL, 'Use same weight as first working set'),
  ('BBB', 'Boring But Big', 5, 10, 'fixed_percentage', 0.50, 'Start at 50% of TM, can progress to 60-70%'),
  ('BBB 60%', 'Boring But Big 60%', 5, 10, 'fixed_percentage', 0.60, 'BBB at 60% intensity'),
  ('SSL', 'Second Set Last', 5, 5, 'second_set', NULL, 'Use same weight as second working set'),
  ('No Supplemental', 'No Supplemental Work', 0, 0, 'fixed_percentage', 0, 'Skip supplemental work');

-- A program template is a reusable default for a new training block.
-- Its cycles and assistance are copied into the block when the block is created.
CREATE TABLE program_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  supplemental_template_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplemental_template_id) REFERENCES supplemental_templates(id)
);

CREATE TABLE program_template_cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_template_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  cycle_type TEXT NOT NULL CHECK(cycle_type IN ('leader', 'anchor', '7th week')),
  seventh_week_template_id INTEGER,
  UNIQUE (program_template_id, position),
  FOREIGN KEY (program_template_id) REFERENCES program_templates(id),
  FOREIGN KEY (seventh_week_template_id) REFERENCES week_templates(id)
);

CREATE TABLE program_template_assistance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_template_id INTEGER NOT NULL,
  lift_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  UNIQUE (program_template_id, lift_id, position),
  FOREIGN KEY (program_template_id) REFERENCES program_templates(id),
  FOREIGN KEY (lift_id) REFERENCES lifts(id),
  FOREIGN KEY (exercise_id) REFERENCES assistance_exercises(id)
);

INSERT INTO program_templates (name, description, supplemental_template_id) VALUES
  ('Triumvirate', 'Main work and two assistance exercises per lift. No supplemental work.',
   (SELECT id FROM supplemental_templates WHERE name = 'No Supplemental'));

INSERT INTO program_template_cycles (program_template_id, position, cycle_type, seventh_week_template_id) VALUES
  ((SELECT id FROM program_templates WHERE name = 'Triumvirate'), 1, 'leader', NULL),
  ((SELECT id FROM program_templates WHERE name = 'Triumvirate'), 2, 'leader', NULL),
  ((SELECT id FROM program_templates WHERE name = 'Triumvirate'), 3, '7th week', (SELECT id FROM week_templates WHERE name = 'Deload'));

INSERT INTO program_template_assistance (program_template_id, lift_id, position, exercise_id, sets, reps)
SELECT
  (SELECT id FROM program_templates WHERE name = 'Triumvirate'),
  (SELECT id FROM lifts WHERE name = a.lift),
  a.position,
  (SELECT id FROM assistance_exercises WHERE name = a.exercise),
  a.sets,
  a.reps
FROM (
  SELECT 'Squat' AS lift, 1 AS position, 'Leg Press' AS exercise, 5 AS sets, 15 AS reps
  UNION ALL SELECT 'Squat', 2, 'Leg Curls', 5, 10
  UNION ALL SELECT 'Bench Press', 1, 'Dumbbell Bench Press', 5, 15
  UNION ALL SELECT 'Bench Press', 2, 'Dumbbell Row', 5, 10
  UNION ALL SELECT 'Deadlift', 1, 'Good Morning', 5, 12
  UNION ALL SELECT 'Deadlift', 2, 'Hanging Leg Raise', 5, 15
  UNION ALL SELECT 'Overhead Press', 1, 'Dips', 5, 15
  UNION ALL SELECT 'Overhead Press', 2, 'Pull-ups/Chin-ups', 5, 10
) AS a;

-- A training block consists of multiple cycles, e.g. 2 leaders, a "7th week", then an anchor.
CREATE TABLE training_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  program_template_id INTEGER,
  start_date DATE NOT NULL,
  training_day_1 TEXT NOT NULL CHECK(training_day_1 IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  training_day_2 TEXT NOT NULL CHECK(training_day_2 IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  training_day_3 TEXT NOT NULL CHECK(training_day_3 IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  training_day_4 TEXT CHECK(training_day_4 IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')), -- null when training three days a week
  lift_day_1_id INTEGER NOT NULL,
  lift_day_2_id INTEGER NOT NULL,
  lift_day_3_id INTEGER NOT NULL,
  lift_day_4_id INTEGER, -- null when training three days a week
  goals TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_date DATE,
  FOREIGN KEY (program_template_id) REFERENCES program_templates(id),
  FOREIGN KEY (lift_day_1_id) REFERENCES lifts(id),
  FOREIGN KEY (lift_day_2_id) REFERENCES lifts(id),
  FOREIGN KEY (lift_day_3_id) REFERENCES lifts(id),
  FOREIGN KEY (lift_day_4_id) REFERENCES lifts(id)
);

CREATE TABLE block_assistance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id INTEGER NOT NULL,
  lift_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  UNIQUE (block_id, lift_id, position),
  FOREIGN KEY (block_id) REFERENCES training_blocks(id),
  FOREIGN KEY (lift_id) REFERENCES lifts(id),
  FOREIGN KEY (exercise_id) REFERENCES assistance_exercises(id)
);

CREATE TABLE cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id INTEGER NOT NULL,
  cycle_number_in_block INTEGER NOT NULL,
  cycle_type TEXT NOT NULL CHECK(cycle_type IN ('leader', 'anchor', '7th week')),
  seventh_week_template_id INTEGER, -- set when cycle_type = '7th week'
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

CREATE TABLE workout_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id INTEGER NOT NULL,
  lift_id INTEGER NOT NULL,
  week_number_in_cycle INTEGER NOT NULL CHECK(week_number_in_cycle BETWEEN 1 AND 3),
  week_template_id INTEGER NOT NULL,
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
CREATE INDEX idx_workout_sessions_cycle ON workout_sessions(cycle_id);

-- The last main set of a session (the one that matters for progression)
CREATE TABLE main_work (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  set_number INTEGER NOT NULL,
  planned_weight REAL NOT NULL,
  planned_reps INTEGER NOT NULL,
  actual_weight REAL,
  actual_reps INTEGER,
  is_amrap BOOLEAN DEFAULT 0,
  supplemental_done BOOLEAN NOT NULL,
  rpe REAL,
  notes TEXT,
  FOREIGN KEY (session_id) REFERENCES workout_sessions(id)
);

CREATE TABLE supplemental_work (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  lift_id INTEGER NOT NULL, -- usually same as main lift, but could differ
  template_id INTEGER NOT NULL,
  set_number INTEGER NOT NULL,
  planned_weight REAL NOT NULL,
  planned_reps INTEGER NOT NULL,
  actual_weight REAL,
  actual_reps INTEGER,
  notes TEXT,
  FOREIGN KEY (session_id) REFERENCES workout_sessions(id),
  FOREIGN KEY (lift_id) REFERENCES lifts(id),
  FOREIGN KEY (template_id) REFERENCES supplemental_templates(id)
);

CREATE TABLE assistance_work (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight REAL,
  notes TEXT,
  FOREIGN KEY (session_id) REFERENCES workout_sessions(id),
  FOREIGN KEY (exercise_id) REFERENCES assistance_exercises(id)
);

CREATE INDEX idx_assistance_work_session ON assistance_work(session_id);
