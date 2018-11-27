# Schema

业务数据模式。

## Constructor

```javascript
new Model(key, definition = {}, options = {})
```

参考 [schema.Entity](https://github.com/paularmstrong/normalizr/blob/master/docs/api.md#entitykey-definition---options--)。

## Members

### `schema.getKey()`

获取业务数据的唯一标识。

### `schema.getEntities(entities)`

从 entities 中提取当前业务类型的数据集合

### `schema.getResult(entities)`

从 entities 中提取当前业务类型的数据标识集合

### `schema.getEntity(entities, id)`

从 entities 中提取指定 id 的业务数据

### `schema.create(data)`

接受数据（对象或者数组）生成 entities 集合，数据结构如下：

```javascript
{
  result: { users: [ 1, 2 ] },
  entities: {
    users: {
      '1': { id: 1 },
      '2': { id: 2 }
    }
  }
}
```
