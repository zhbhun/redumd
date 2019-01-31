# `init(options)`

初始化创建 redux store。

## Arguments

1. `options` _(Object)_：配置对象

    - `reducers` _(Object)_：redux 的 reducer 对象结合，类似与 redux/compose 的接受参数，非必填
    - `preloadedState`（Object|Array）：初始化状态，非必填
    - `middlewares`（Array）：中间件， 非必填
    - `enhancers`（Array）：增强器， 非必填
    - `effect`（Function）：副作用函数，非必填
    - `models`（Array）：Model 实例，非必填
    - `entities` _(Object)_：定制的 Entities 实例，非必填
    - `devtool` _(Object)_：开发工具配置，非必填，参考 [redux-devtools-extension](https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md#options)

## Returns

（[`Store`](https://github.com/reduxjs/redux/blob/master/docs/api/Store.md)）：一个对象实例，包含了管理状态的一些工具函数。

- model：向 Store 中添加 Mode 实例
- unmodel：从 Store 中删除 Model 实例
- runSagaTask：运行副作用任务
