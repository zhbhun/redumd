# Redumd

Redumd 是基于 redux 封装的易于使用的状态管理框架。

- 将 redux 的 action，reduce 和 selector 等以 Model 的形式放在一个模块内实现（类似与 Dva.js 的 model）；
- 集成 redux-saga，轻松实现 redux 的异步逻辑；
- 内置易于使用的业务状态和应用状态管理 Model。

## 用法

```javascript
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { init, Model } from 'redumd';

class Counter extends Model {
  static defaultState = {
    timers: 0
  };

  static reducers = {
    increment: function(state) {
      return { timers: state.timers + 1 };
    },
    decrement: function(state) {
      return { timers: state.timers - 1 };
    }
  };

  constructor(namespace) {
    super(namespace);

    this.getTimers = state => this.getState(state).timers;
  }
}

class Demo extends Component {
  incrementIfOdd = () => {
    if (this.props.value % 2 !== 0) {
      this.props.onIncrement();
    }
  };

  incrementAsync = () => {
    setTimeout(this.props.onIncrement, 1000);
  };

  render() {
    const { value, onIncrement, onDecrement } = this.props;
    return (
      <p>
        Clicked: {value} times <button onClick={onIncrement}>+</button>{' '}
        <button onClick={onDecrement}>-</button>{' '}
        <button onClick={this.incrementIfOdd}>Increment if odd</button>{' '}
        <button onClick={this.incrementAsync}>Increment async</button>
      </p>
    );
  }
}

const counter1 = new Counter('counter1');
const counter2 = new Counter('counter2');
const store = init({
  models: [counter1, counter2]
});
const rootEl = document.getElementById('root');

const render = () =>
  ReactDOM.render(
    <div>
      <div>
        <h1>Counter1</h1>
        <Demo
          value={counter1.getTimers(store.getState())}
          onIncrement={() => store.dispatch(counter1.actions.increment())}
          onDecrement={() => store.dispatch(counter1.actions.decrement())}
        />
      </div>
      <div>
        <h1>Counter2</h1>
        <Demo
          value={counter2.getTimers(store.getState())}
          onIncrement={() => store.dispatch(counter2.actions.increment())}
          onDecrement={() => store.dispatch(counter2.actions.decrement())}
        />
      </div>
    </div>,
    rootEl
  );

render();
store.subscribe(render);
```

## 文档

- [API](./doc/api/README.md)

## 示例

- [Counter](https://codesandbox.io/s/xr60620z0o)

## License

MIT
