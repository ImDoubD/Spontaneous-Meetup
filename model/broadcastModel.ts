import mongoose, { Schema, Document } from 'mongoose';

interface ILocation {
  type: 'Point';
  coordinates: [number, number];
}

export interface IBroadcast extends Document {
  title: string;
  description: string;
  hostUserId: string;
  activityType: string;
  startTime: Date;
  endTime: Date;
  location: ILocation;
  status: 'active' | 'expired';
  participants: string[];
  createdAt: Date;
}

const LocationSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false } // no _id for the nested schema
);

const BroadcastSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: String,
  hostUserId: { type: String, required: true },
  activityType: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  location: { type: LocationSchema, required: true }, // Mark location as required
  status: { type: String, enum: ['active', 'expired'], default: 'active' },
  participants: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

// Geospatial index for location-based queries
BroadcastSchema.index({ location: '2dsphere' });
BroadcastSchema.index({ status: 1, endTime: 1 });

export const Broadcast = mongoose.model<IBroadcast>('Broadcast', BroadcastSchema);
export default mongoose.model<IBroadcast>('Broadcast', BroadcastSchema);
