// TODO: Consider using prepared statement instead!
export const createSessions = (cycle_id: number) => `
-- assumes
-- Squat, Bench, Deadlift, Overhead Press
-- mandag, tirsdag, torsdag, fredag
INSERT INTO workout_sessions (cycle_id, lift_id, week_number_in_cycle, week_template_id, planned_date)
  VALUES
-- week 1
(${cycle_id}, 1, 1, (SELECT id from week_templates where week_number = 1), date((SELECT planned_date FROM cycles WHERE id = ${cycle_id}))), 
(${cycle_id}, 2, 1, (SELECT id from week_templates where week_number = 1), date((SELECT planned_date FROM cycles WHERE id = ${cycle_id}), '+1 days')),
(${cycle_id}, 4, 1, (SELECT id from week_templates where week_number = 1), date((SELECT planned_date FROM cycles WHERE id = ${cycle_id}), '+3 days')),
(${cycle_id}, 3, 1, (SELECT id from week_templates where week_number = 1), date((SELECT planned_date FROM cycles WHERE id = ${cycle_id}), '+4 days')),

-- week 2
(${cycle_id}, 1, 2, (SELECT id from week_templates where week_number = 2), date((SELECT planned_date FROM cycles WHERE id = ${cycle_id}), '+7 days')),
(${cycle_id}, 2, 2, (SELECT id from week_templates where week_number = 2), date((SELECT planned_date FROM cycles WHERE id = ${cycle_id}), '+8 days')),
(${cycle_id}, 4, 2, (SELECT id from week_templates where week_number = 2), date((SELECT planned_date FROM cycles WHERE id = ${cycle_id}), '+10 days')),
(${cycle_id}, 3, 2, (SELECT id from week_templates where week_number = 2), date((SELECT planned_date FROM cycles WHERE id = ${cycle_id}), '+11 days')),

-- week 3
(${cycle_id}, 1, 3, (SELECT id from week_templates where week_number = 3), date((SELECT planned_date FROM cycles WHERE id = ${cycle_id}), '+14 days')),
(${cycle_id}, 2, 3, (SELECT id from week_templates where week_number = 3), date((SELECT planned_date FROM cycles WHERE id = ${cycle_id}), '+15 days')),
(${cycle_id}, 4, 3, (SELECT id from week_templates where week_number = 3), date((SELECT planned_date FROM cycles WHERE id = ${cycle_id}), '+17 days')),
(${cycle_id}, 3, 3, (SELECT id from week_templates where week_number = 3), date((SELECT planned_date FROM cycles WHERE id = ${cycle_id}), '+18 days'));
`;
