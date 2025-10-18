
-- Main work sets,The last main set for a workout (main work sets)
CREATE TABLE main_work (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    set_number INTEGER NOT NULL,
    planned_weight REAL NOT NULL,
    planned_reps INTEGER NOT NULL,
    actual_weight REAL,
    actual_reps INTEGER,
    is_amrap BOOLEAN DEFAULT 0,
    rpe REAL, -- Rate of Perceived Exertion (optional)
    notes TEXT,
    FOREIGN KEY (session_id) REFERENCES workout_sessions(session_id)
);

-- Supplemental work performed during sessions (separate from main work)
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
    FOREIGN KEY (session_id) REFERENCES workout_sessions(session_id),
    FOREIGN KEY (lift_id) REFERENCES lifts(lift_id),
    FOREIGN KEY (template_id) REFERENCES supplemental_templates(template_id)
);

-- Assistance work performed during sessions
CREATE TABLE assistance_work (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    sets INTEGER,
    reps INTEGER,
    weight REAL,
    notes TEXT,
    FOREIGN KEY (session_id) REFERENCES workout_sessions(session_id),
    FOREIGN KEY (exercise_id) REFERENCES assistance_exercises(exercise_id)
);

