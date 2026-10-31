import sampleStoryRaw from '../../fixtures/sample-story.json';
import { sanitizeGraph } from './graph';
import { GraphState } from './types';

export function createSampleGraph(): GraphState {
  return sanitizeGraph(sampleStoryRaw);
}

export function createEmptyGraph(): GraphState {
  return {
    schemaVersion: 1,
    name: 'Empty Canvas',
    nodes: [],
    edges: [],
  };
}
