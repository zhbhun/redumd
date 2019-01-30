import mergeWith from 'lodash.mergewith';
import Model from './Model';
import Schema from './Schema';

const mergeCustomizer = (objValue, srcValue, key, object, source, stack) => {
  if (Array.isArray(objValue)) {
    return srcValue;
  }
  return undefined;
};
const merge = (...args) => mergeWith(...args, mergeCustomizer);
function update(state, { payload, meta }) {
  if (payload) {
    if (meta && meta instanceof Schema) {
      const { entities } = meta.create(payload);
      return merge({}, state, entities);
    }
    if (payload.entities) {
      const { entities } = payload;
      return merge({}, state, entities);
    }
  }
  return state;
}

class Entities extends Model {
  static reducers = {
    reset: update,
    prepend: update,
    append: update,
    update,
    remove: update,
  };

  constructor(namespace) {
    super(namespace || '@ENTITIES');

    this.getEntities = (state, schema) => this.getState(state)[schema.getKey()];
  }
}

export default Entities;
