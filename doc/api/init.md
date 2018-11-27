# `init(options)`

初始化创建 redux store。

## Arguments

1. `options`（Object）：配置对象

    - `reducers`（Object）：redux 的 reducer 对象结合，类似与 redux/compose 的接受参数
    - `preloadedState`（Object|Array）：初始化状态
    - `middlewares`（Array）：中间件
    - `enhancers`（Array）：增强器
    - `effect`（Function）：副作用哈哈苏
    - `models`（Array）：Model 实例
    - `entities`（Object）：Entities 实例

## Returns

（[`Store`](https://github.com/reduxjs/redux/blob/master/docs/api/Store.md)）：一个对象实例，包含了管理状态的一些工具函数。

- model：向 Store 中添加 Mode 实例
- unmodel：从 Store 中删除 Model 实例
- runSagaTask：运行副作用任务
