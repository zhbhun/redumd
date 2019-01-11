import { normalize, schema } from 'normalizr';

class Schema {
  /**
   * @see https://github.com/paularmstrong/normalizr/blob/master/docs/api.md#entitykey-definition---options--
   */
  constructor(key, definition, { entities, ...options } = {}) {
    this.entity = new schema.Entity(key, definition || {}, options);
    this.entities = entities;
  }

  getKey = () => this.entity.key;

  /**
   * @param {Object} entities 传入的 entities 支持 redux store 全局状态，或者是某个具体 entities 状态
   */
  getEntities = entities => {
    // 判断传入的 entities 参数是否是 redux store 全局状态
    if (this.entities && entities[this.entities.namespace]) {
      return this.entities.getEntities(entities, this) || {};
    }
    return entities ? entities[this.entity.key] || {} : {};
  };

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
