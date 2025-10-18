-- Core lifts configuration (Squat, Bench Press, Deadlift, Overhead Press)
CREATE TABLE IF NOT EXISTS lifts (
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

-- Training max history for tracking progression
CREATE TABLE training_max_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lift_id INTEGER NOT NULL,
    training_max REAL NOT NULL,
    effective_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lift_id) REFERENCES lifts(id)
);

-- Assistance exercises
CREATE TABLE assistance_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
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
    ('Back Extensions', 'legs/core', 'Lower back/glute');

