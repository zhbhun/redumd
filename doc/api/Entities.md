# Entities

Entities 是业务状态管理 Model。

## Static members

### `Entities.defaultState`

默认状态为 `{ index: {} }`

### `Entities.reducers`

redux reducers

- `Entities.reducers.reset(state, action)`：重置
- `Entities.reducers.prepend(state, action)`：插入
- `Entities.reducers.append(state, action)`：追加
- `Entities.reducers.update(state, action)`：更新
- `Entities.reducers.remove(state, action)`：删除

## Constructor

```javascript
new ENTITIES(namespace)
```

## Instance Membes

### Action Creators

根据 ENTITIES.reducers 生成

- `entities.reducers.reset(payload)`：重置
- `entities.reducers.prepend(payload)`：插入
- `entities.reducers.append(payload)`：追加
- `entities.reducers.update(payload)`：更新
- `entities.reducers.remove(payload)`：删除

### Selectors

状态选择器

- `entities.getState(state)`：获取当前 Entities 实例维护的状态
- `entities.getEntities(state, schema)`：获取当前 Entities 实例维护的指定业务状态

    schema 是 [Schema](./Schema.md) 实例。

### Effecs

None
