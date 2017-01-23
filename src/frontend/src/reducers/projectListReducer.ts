import {evolve} from 'ramda';
import {projectRef, fileRef} from '../types';
import projectReducer, {projectReducerState} from './projectReducer';
export interface projectListReducerState {
  [key: string]: any;
  projects: {
    [id : number]: projectReducerState
  }
};
export interface projectListReducerAction {type: string, payload: projectListReducerState}
export const appStateActions = {
  openProject: 'state_open_project',
  openFile: 'state_open_file'
};
export default function projectListReducer(state:projectListReducerState  = {projects:{1:{name: "A1 Racket", id:1},2:{name: "A2 C Functions", id:2}}}, action:projectListReducerAction) {
  switch (action.type) {
    /*case appStateActions.openProject:
      return evolve(state, {project: action.payload.project});
    case appStateActions.openFile:
      return evolve(state, {file: action.payload.file});*/
    default:
      return state;
  }
}