-- Template names and descriptions are shown in the UI, which is in Norwegian.
-- Established 5/3/1 terms (FSL, BBB, SSL, Deload, PR) are kept as they are.
UPDATE supplemental_templates SET name = 'Ingen supplemental', description = 'Ingen supplementalarbeid',
  notes = 'Hopp over supplementalarbeid' WHERE name = 'No Supplemental';
UPDATE supplemental_templates SET notes = 'Samme vekt som første arbeidssett' WHERE name = 'FSL';
UPDATE supplemental_templates SET notes = 'Samme vekt som andre arbeidssett' WHERE name = 'SSL';
UPDATE supplemental_templates SET notes = 'Start på 50 % av TM, kan økes til 60–70 %' WHERE name = 'BBB';
UPDATE supplemental_templates SET notes = 'BBB på 60 % av TM' WHERE name = 'BBB 60%';

UPDATE week_templates SET name = 'TM-test' WHERE name = 'TM Test';

UPDATE program_templates
SET description = 'Hovedløft og to assistanseøvelser per løft. Ingen supplemental.'
WHERE name = 'Triumvirate';
