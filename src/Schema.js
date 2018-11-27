import { normalize, schema } from 'normalizr';

class Schema {
  /**
   * @see https://github.com/paularmstrong/normalizr/blob/master/docs/api.md#entitykey-definition---options--
   */
  constructor(...args) {
    this.entity = new schema.Entity(...args);
  }

  getKey = () => this.entity.key;

  getEntities = entities => (entities ? entities[this.entity.key] || {} : {});

  getResult = entities =>
    entities && entities.result ? entities.result[this.entity.key] || [] : [];

  getEntity = (entities, id) => this.getEntities(entities)[id];

  create = data =>
    normalize(
      { [this.entity.key]: data },
      { [this.entity.key]: Array.isArray(data) ? [this.entity] : this.entity }
    );
}

export default Schema;
