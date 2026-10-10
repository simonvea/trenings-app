-- Start of the session to its last logged set, timed on the phone. Null for sessions logged
-- without the timer.
ALTER TABLE workout_sessions ADD COLUMN duration_seconds INTEGER;
