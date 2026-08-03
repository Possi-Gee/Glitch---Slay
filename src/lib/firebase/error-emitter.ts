
import { EventEmitter } from 'events';

// This is a simple event emitter that will be used to bubble up errors
// from the data layer to the UI layer.
export const errorEmitter = new EventEmitter();
