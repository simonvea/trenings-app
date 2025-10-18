-- Week templates (Week 1: 5+, Week 2: 3+, Week 3: 5/3/1+, Week 4 ("7th week"): Deload / TM TEST / PR)
CREATE TABLE IF NOT EXISTS week_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_number INTEGER NOT NULL CHECK(week_number BETWEEN 1 AND 4),
    name TEXT NOT NULL, -- '5+', '3+', '5/3/1+', 'Deload', 'TM Test', 'PR'
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
    set_4_percentage REAL, -- Set only applicable for "7th week"
    set_4_reps INTEGER
);
-- Week 1: 5+ (65%, 75%, 85%+)
INSERT INTO week_templates (week_number, name, warmup_set_1_percentage,warmup_set_1_reps, warmup_set_2_percentage, warmup_set_2_reps, warmup_set_3_percentage, warmup_set_3_reps, set_1_percentage, set_1_reps, set_2_percentage, set_2_reps, set_3_percentage, set_3_reps)
VALUES (1, '5+', 0.40, 5, 0.50, 5, 0.60, 5, 0.65, 5, 0.75, 5, 0.85, -5);

-- Week 2: 3+ (70%, 80%, 90%+)
INSERT INTO week_templates (week_number, name, warmup_set_1_percentage,warmup_set_1_reps, warmup_set_2_percentage, warmup_set_2_reps, warmup_set_3_percentage, warmup_set_3_reps, set_1_percentage, set_1_reps, set_2_percentage, set_2_reps, set_3_percentage, set_3_reps)
VALUES (2, '3+', 0.40, 5, 0.50, 5, 0.60, 5, 0.70, 3, 0.80, 3, 0.90, -3);

-- Week 3: 5/3/1+ (75%, 85%, 95%+)
INSERT INTO week_templates (week_number, name, warmup_set_1_percentage,warmup_set_1_reps, warmup_set_2_percentage, warmup_set_2_reps, warmup_set_3_percentage, warmup_set_3_reps, set_1_percentage, set_1_reps, set_2_percentage, set_2_reps, set_3_percentage, set_3_reps)
VALUES (3, '5/3/1+', 0.40, 5, 0.50, 5, 0.6, 5, 0.75, 5, 0.85, 3, 0.95, -1);

-- Week 4: Deload, third working set 3-5 reps
INSERT INTO week_templates (week_number, name, warmup_set_1_percentage,warmup_set_1_reps, warmup_set_2_percentage, warmup_set_2_reps, warmup_set_3_percentage, warmup_set_3_reps, set_1_percentage, set_1_reps, set_2_percentage, set_2_reps, set_3_percentage, set_3_reps, set_4_percentage, set_4_reps)
VALUES (4, 'Deload', 0.40, 5, 0.50, 5, 0.60, 5, 0.70, 5, 0.80, 5, 0.90, 1, 1, 1);

-- Week 4: TM Test , last set 3-5 reps 
INSERT INTO week_templates (week_number, name, warmup_set_1_percentage,warmup_set_1_reps, warmup_set_2_percentage, warmup_set_2_reps, warmup_set_3_percentage, warmup_set_3_reps, set_1_percentage, set_1_reps, set_2_percentage, set_2_reps, set_3_percentage, set_3_reps, set_4_percentage, set_4_reps)
VALUES (4, 'TM Test', 0.40, 5, 0.50, 5, 0.60, 5, 0.70, 5, 0.80, 5, 0.90, 5, 1, 5);

-- Week 4: PR week , last set goal reps
INSERT INTO week_templates (week_number, name, warmup_set_1_percentage,warmup_set_1_reps, warmup_set_2_percentage, warmup_set_2_reps, warmup_set_3_percentage, warmup_set_3_reps, set_1_percentage, set_1_reps, set_2_percentage, set_2_reps, set_3_percentage, set_3_reps, set_4_percentage, set_4_reps)
VALUES (4, 'PR', 0.40, 5, 0.50, 5, 0.60, 5, 0.70, 5, 0.80, 5, 0.90, 5, 1, -3);


-- Supplemental templates (FSL, BBB, etc.)
CREATE TABLE IF NOT EXISTS supplemental_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE, -- 'FSL', 'BBB', 'SSL', etc.
    description TEXT,
    sets INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight_calculation TEXT NOT NULL, -- 'first_set', 'fixed_percentage', 'custom'
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


