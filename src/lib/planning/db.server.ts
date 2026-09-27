import assert from 'node:assert';
import { sql, transaction } from '$lib/server/db';
import type {
	AssistanceExerciseDb,
	LiftsDb,
	SupplementalTemplateDb,
	TrainingBlockDb,
	WeekTemplateDb
} from '$lib/types';
import type {
	AssistancePlan,
	CyclePlan,
	CycleType,
	NewBlock,
	PlannedCycle,
	ProgramTemplate,
	TrainingMaxPlan
} from './types';

type ProgramTemplateRow = {
	id: number;
	name: string;
	description: string | null;
	supplemental_template_id: number | null;
};
type TemplateCycleRow = {
	program_template_id: number;
	cycle_type: CycleType;
	seventh_week_template_id: number | null;
};
type TemplateAssistanceRow = {
	program_template_id: number;
	lift_id: number;
	position: number;
	exercise_id: number;
	sets: number;
	reps: number;
};

const toCyclePlan = (row: TemplateCycleRow, supplementalTemplateId?: number): CyclePlan =>
	row.cycle_type === '7th week'
		? { type: row.cycle_type, seventhWeekTemplateId: row.seventh_week_template_id ?? undefined }
		: { type: row.cycle_type, supplementalTemplateId };

const toAssistancePlan = (row: TemplateAssistanceRow): AssistancePlan => ({
	liftId: row.lift_id,
	position: row.position,
	exerciseId: row.exercise_id,
	sets: row.sets,
	reps: row.reps
});

export function listProgramTemplates(): ProgramTemplate[] {
	const templates = sql.all`SELECT * FROM program_templates ORDER BY name` as ProgramTemplateRow[];
	const cycles = sql.all`SELECT * FROM program_template_cycles
		ORDER BY program_template_id, position` as TemplateCycleRow[];
	const assistance = sql.all`SELECT * FROM program_template_assistance
		ORDER BY program_template_id, lift_id, position` as TemplateAssistanceRow[];

	return templates.map((t) => {
		const supplementalTemplateId = t.supplemental_template_id ?? undefined;
		return {
			id: t.id,
			name: t.name,
			description: t.description ?? undefined,
			supplementalTemplateId,
			cycles: cycles
				.filter((c) => c.program_template_id === t.id)
				.map((c) => toCyclePlan(c, supplementalTemplateId)),
			assistance: assistance.filter((a) => a.program_template_id === t.id).map(toAssistancePlan)
		};
	});
}

export function loadPlanningOptions() {
	return {
		programTemplates: listProgramTemplates(),
		lifts: sql.all`SELECT * FROM lifts ORDER BY id` as LiftsDb[],
		exercises:
			sql.all`SELECT * FROM assistance_exercises ORDER BY category, name` as AssistanceExerciseDb[],
		supplementalTemplates:
			sql.all`SELECT * FROM supplemental_templates ORDER BY id` as SupplementalTemplateDb[],
		seventhWeekTemplates:
			sql.all`SELECT * FROM week_templates WHERE week_number = 4 ORDER BY id` as WeekTemplateDb[]
	};
}

export function mainWeekTemplateIds(): [number, number, number] {
	const rows = sql.all`SELECT id FROM week_templates
		WHERE week_number BETWEEN 1 AND 3 ORDER BY week_number` as { id: number }[];
	assert(rows.length === 3, `Expected one week template per week 1-3, found ${rows.length}`);
	return [rows[0].id, rows[1].id, rows[2].id];
}

/** Inserts the block with its cycles, assistance plan and sessions. Returns the block id. */
export function createBlock(block: NewBlock, cycles: PlannedCycle[]): number {
	assert(block.days.length === 4, `Expected 4 training days, got ${block.days.length}`);
	assert(cycles.length > 0, 'A block needs at least one cycle');

	const [d1, d2, d3, d4] = block.days;

	return transaction(() => {
		const { lastInsertRowid } = sql.run`INSERT INTO training_blocks
			(name, goals, program_template_id, start_date,
			 training_day_1, training_day_2, training_day_3, training_day_4,
			 lift_day_1_id, lift_day_2_id, lift_day_3_id, lift_day_4_id)
			VALUES (${block.name}, ${block.goals ?? null}, ${block.programTemplateId ?? null}, ${block.startDate},
			 ${d1.weekday}, ${d2.weekday}, ${d3.weekday}, ${d4.weekday},
			 ${d1.liftId}, ${d2.liftId}, ${d3.liftId}, ${d4.liftId})`;
		const blockId = Number(lastInsertRowid);

		writeTrainingMaxes(block.trainingMaxes);

		for (const a of block.assistance) {
			sql.run`INSERT INTO block_assistance (block_id, lift_id, position, exercise_id, sets, reps)
				VALUES (${blockId}, ${a.liftId}, ${a.position}, ${a.exerciseId}, ${a.sets}, ${a.reps})`;
		}

		for (const c of cycles) {
			const cycle = sql.run`INSERT INTO cycles
				(block_id, cycle_number_in_block, cycle_type, seventh_week_template_id, supplemental_template_id, start_date, end_date)
				VALUES (${blockId}, ${c.numberInBlock}, ${c.type}, ${c.seventhWeekTemplateId ?? null},
				 ${c.supplementalTemplateId ?? null}, ${c.startDate}, ${c.endDate})`;
			const cycleId = Number(cycle.lastInsertRowid);

			for (const s of c.sessions) {
				sql.run`INSERT INTO workout_sessions (cycle_id, lift_id, week_number_in_cycle, week_template_id, planned_date)
					VALUES (${cycleId}, ${s.liftId}, ${s.weekNumberInCycle}, ${s.weekTemplateId}, ${s.plannedDate})`;
			}
		}

		return blockId;
	});
}

export type BlockSummary = Pick<
	TrainingBlockDb,
	'id' | 'name' | 'start_date' | 'completed_date'
> & {
	end_date: string | null;
	template_name: string | null;
	sessions_total: number;
	sessions_completed: number;
};

export function listBlocks(): BlockSummary[] {
	return sql.all`SELECT b.id, b.name, b.start_date, b.completed_date,
			MAX(c.end_date) AS end_date,
			pt.name AS template_name,
			COUNT(s.id) AS sessions_total,
			COUNT(CASE WHEN s.status = 'completed' THEN 1 END) AS sessions_completed
		FROM training_blocks AS b
		LEFT JOIN program_templates AS pt ON pt.id = b.program_template_id
		LEFT JOIN cycles AS c ON c.block_id = b.id
		LEFT JOIN workout_sessions AS s ON s.cycle_id = c.id
		GROUP BY b.id
		ORDER BY b.start_date DESC` as BlockSummary[];
}

export function completeBlock(blockId: number): void {
	sql.run`UPDATE training_blocks SET completed_date = date('now') WHERE id = ${blockId}`;
}

// Callers own the transaction, so a block and its training maxes are saved together
function writeTrainingMaxes(trainingMaxes: TrainingMaxPlan[]): void {
	assert(
		trainingMaxes.every((tm) => tm.trainingMax >= 0),
		`Training max must not be negative: ${JSON.stringify(trainingMaxes)}`
	);

	for (const { liftId, trainingMax } of trainingMaxes) {
		const current = sql.get`SELECT current_training_max FROM lifts WHERE id = ${liftId}` as
			| Pick<LiftsDb, 'current_training_max'>
			| undefined;
		assert(current, `Unknown lift ${liftId}`);
		if (current.current_training_max === trainingMax) continue;

		sql.run`UPDATE lifts SET current_training_max = ${trainingMax}, updated_at = CURRENT_TIMESTAMP
			WHERE id = ${liftId}`;
		sql.run`INSERT INTO training_max_history (lift_id, training_max, effective_date)
			VALUES (${liftId}, ${trainingMax}, date('now'))`;
	}
}

export function updateTrainingMaxes(trainingMaxes: TrainingMaxPlan[]): void {
	transaction(() => writeTrainingMaxes(trainingMaxes));
}
