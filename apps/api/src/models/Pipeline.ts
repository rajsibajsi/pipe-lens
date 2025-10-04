import { type Document, model, Schema, type Types } from 'mongoose';

export interface IPipeline extends Document {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	name: string;
	description?: string;
	tags: string[];
	pipeline: object[];
	connectionId: string;
	database: string;
	collectionName: string;
	sampleSize: number;
	isPublic: boolean;
	isTemplate: boolean;
	version: number;
	createdAt: Date;
	updatedAt: Date;
	lastExecutedAt?: Date;
	executionCount: number;
	metadata: {
		estimatedExecutionTime?: number;
		complexity?: 'simple' | 'medium' | 'complex';
		category?: string;
		difficulty?: 'beginner' | 'intermediate' | 'advanced';
	};
	incrementExecution(): Promise<IPipeline>;
	calculatedComplexity: string;
}

const pipelineSchema = new Schema<IPipeline>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 100,
		},
		description: {
			type: String,
			trim: true,
			maxlength: 500,
		},
		tags: [
			{
				type: String,
				trim: true,
				maxlength: 50,
			},
		],
		pipeline: {
			type: [Schema.Types.Mixed],
			required: true,
			validate: {
				validator: (pipeline: object[]) => Array.isArray(pipeline) && pipeline.length > 0,
				message: 'Pipeline must be a non-empty array of aggregation stages',
			},
		},
		connectionId: {
			type: String,
			required: true,
			trim: true,
		},
		database: {
			type: String,
			required: true,
			trim: true,
		},
		collectionName: {
			type: String,
			required: true,
			trim: true,
		},
		sampleSize: {
			type: Number,
			default: 10,
			min: 1,
			max: 1000,
		},
		isPublic: {
			type: Boolean,
			default: false,
			index: true,
		},
		isTemplate: {
			type: Boolean,
			default: false,
			index: true,
		},
		version: {
			type: Number,
			default: 1,
			min: 1,
		},
		createdAt: {
			type: Date,
			default: Date.now,
			index: true,
		},
		updatedAt: {
			type: Date,
			default: Date.now,
		},
		lastExecutedAt: {
			type: Date,
		},
		executionCount: {
			type: Number,
			default: 0,
			min: 0,
		},
		metadata: {
			estimatedExecutionTime: {
				type: Number,
				min: 0,
			},
			complexity: {
				type: String,
				enum: ['simple', 'medium', 'complex'],
			},
			category: {
				type: String,
				trim: true,
				maxlength: 50,
			},
			difficulty: {
				type: String,
				enum: ['beginner', 'intermediate', 'advanced'],
			},
		},
	},
	{
		timestamps: true,
	},
);

// Indexes
pipelineSchema.index({ userId: 1, createdAt: -1 });
pipelineSchema.index({ userId: 1, name: 1 }, { unique: true });
pipelineSchema.index({ isPublic: 1, createdAt: -1 });
pipelineSchema.index({ tags: 1 });
pipelineSchema.index({ isTemplate: 1, 'metadata.category': 1 });
pipelineSchema.index({ 'metadata.category': 1 });

// Pre-save middleware
pipelineSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});

// Virtual for pipeline complexity calculation
pipelineSchema.virtual('calculatedComplexity').get(function () {
	const stageCount = this.pipeline.length;
	const hasComplexStages = this.pipeline.some((stage: unknown) => {
		const s = stage as Record<string, unknown>;
		return Boolean(s.$lookup || s.$facet || s.$graphLookup || s.$unionWith);
	});

	if (stageCount <= 3 && !hasComplexStages) return 'simple';
	if (stageCount <= 6 && !hasComplexStages) return 'medium';
	return 'complex';
});

// Method to increment execution count
pipelineSchema.methods.incrementExecution = function () {
	this.executionCount += 1;
	this.lastExecutedAt = new Date();
	return this.save();
};

export const Pipeline = model<IPipeline>('Pipeline', pipelineSchema);
