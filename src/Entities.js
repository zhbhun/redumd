import merge from 'lodash.merge';
import union from 'lodash.union';
import without from 'lodash.without';
import difference from 'lodash.difference';
import Model from './Model';

class Entities extends Model {
  static defaultState = {
    index: {},
  };

  static reducers = {
    reset(
      state,
      {
        payload: { entities, result },
      }
    ) {
      return {
        ...merge({}, state, entities),
        index: {
          ...state.index,
          ...result,
        },
      };
    },
    prepend(
      state,
      {
        payload: { entities, result },
      }
    ) {
      return {
        ...merge({}, state, entities),
        index: {
          ...state.index,
          ...Object.keys(result).reduce((acc, key) => {
            const oldIds = state.index[key] || [];
            const newIds = Array.isArray(result[key])
              ? result[key]
              : [result[key]];
            acc[key] = union(difference(newIds, oldIds), oldIds);
            return acc;
          }, {}),
        },
      };
    },
    append(
      state,
      {
        payload: { entities, result },
      }
    ) {
      return {
        ...merge({}, state, entities),
        index: {
          ...state.index,
          ...Object.keys(result).reduce((acc, key) => {
            const oldIds = state.index[key] || [];
            const newIds = Array.isArray(result[key])
              ? result[key]
              : [result[key]];
            acc[key] = union(oldIds, difference(newIds, oldIds));
            return acc;
          }, {}),
        },
      };
    },
    update(
      state,
      {
        payload: { entities },
      }
    ) {
      return {
        ...merge({}, state, entities),
      };
    },
    remove(
      state,
      {
        payload: { result },
      }
    ) {
      return {
        ...state,
        index: {
          ...state.index,
          ...Object.keys(result).reduce((acc, key) => {
            const oldIds = state.index[key] || [];
            const removeIds = Array.isArray(result[key])
              ? result[key]
              : [result[key]];
            acc[key] = without(oldIds, ...removeIds);
            return acc;
          }, {}),
        },
      };
    },
  };

  constructor(namespace) {
    super(namespace || '@ENTITIES');

    this.getEntities = (state, schema) => this.getState(state)[schema.getKey()];
  }
}

export default Entities;
