# Model

Model 是根状态管理 Model，所有的其他定制 Model 都直接或间接的继承于它。继承 Model 的状态管理类可以通过以下行为来制定属于自己的状态维护逻辑。

- 静态成员属性 defaultState 用于 redux store 的默认状态
- 静态成员属性 reducers 包含 redux 的 reducer 函数，该属性是个 Object 类型。key 值是要执行的动作。value 是一个标准 reducer 处理函数，接受两个参数，第一个是状态，第二是动作对象。Model 会自动根据静态成员属性 reducers 生成对应的动作创建器，并赋值给状态管理类的实例。例如下面的这个示例：

    ```javascript
    import { Model } from 'redumd';

    class Counter extends Model {
      static defaultState= {
        timers: 0,
      };

      static reducers = {
        increment: function(state) {
          return { timers: state.timers + 1 };
        },
        decrement: function(state) {
          return { timers: state.timers - 1 };
        },
      };
    }

    const counter = new Coutner('counter1');
    // coutner.actions 是这样一个对象实例 { increment: fucntion, decrement: function }
    // counter.actions value 值是动作创建器，调用后返回动作对象 { type: string, payload: any, meta: Object}
    // 动作对象的 type 是构造函数接受的 namespace 和 reducers 的 key 值凭借而成，例如 `coutner1/increment`
    ```

- Model 会收集属于 Generator 类型的成员函数，统一作为副作用函数（redux-saga）调用。此外，副作用函数也会生成对应动作生成器。
- 利用继承自 Model 的 getState 成员函数可以获取当前命名空间的状态，进而定制各种各样的状态选择器。

## Constructor

```javascript
new Model(namespace)
```

## Members

### `model.namespace`

维护状态的命名空间。

### `model.types`

动作类型对象，基于 Model.reducers 和 model 上的副作用函数生成，key 值对应 reducer 和 副作用函数的名称，value 值是包含命名空间的唯一动作类型。

### `model.actions`

动作创建函数对象，基于 Model.reducers 和 model 上的副作用函数生成，key 值对应 reducer 和 副作用函数的名称，value 值是一个动作创建函数，创建的动作对象结构如下：

```javascript
{
  type: 'namespace/action',
  payload: any,
  meta: object
}
```

### `model.tasks`

副作用非阻塞任务，key 值是副作用函数的名称，value 为 redux-saga/effects/fork 函数返回值。

### `model.watcher`

副作用任务监听任务，key 值是副作用函数的名称，value 为 redux-saga/effects/fork 函数返回值。

## Methods

### `model.reduce()`

reducer 处理函数

### `model.effect()`

副作用执行函数

### `model.destroy(action)`

销毁 redux-saga 的副作用任务

### `model.getState(state)`

获取维护的状态
