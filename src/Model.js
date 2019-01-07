import { cancel, call, fork, takeEvery } from 'redux-saga/effects';

const TYPE_DIVIDED_SYMBOLS = '/';
const makeType = (namespace, type) =>
  `${namespace}${TYPE_DIVIDED_SYMBOLS}${type}`;
const makeActionCreator = type =>
  function actionCreator(payload, meta) {
    return {
      type,
      payload,
      meta,
    };
  };
// prettier-ignore
const GeneratorFunction = (function*(){}).constructor; // eslint-disable-line
const isGeneratorFunction = func => func instanceof GeneratorFunction;
const extractReducers = instance => {
  let reducers = {};
  let defaultState = {};
  let prototype = Object.getPrototypeOf(instance);
  let constructor = prototype && prototype.constructor;
  while (constructor && (constructor.defaultState || constructor.reducers)) {
    reducers = Object.assign({}, constructor.reducers, reducers);
    defaultState = Object.assign({}, constructor.defaultState, defaultState);
    prototype = Object.getPrototypeOf(prototype);
    constructor = prototype && prototype.constructor;
  }
  return {
    reducers,
    defaultState,
  };
};
const extractGeneratorFunctions = instance => {
  const effects = {};
  let prototype = Object.getPrototypeOf(instance);
  let constructor = prototype && prototype.constructor;
  while (constructor) {
    const keys = Object.getOwnPropertyNames(prototype);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const value = instance[key];
      if (!effects[key] && value && isGeneratorFunction(value)) {
        effects[key] = value;
      }
    }
    prototype = Object.getPrototypeOf(prototype);
    constructor = prototype && prototype.constructor;
  }
  return effects;
};
const makStateGetter = keys => state => {
  if (keys.length <= 1) {
    return state[keys[0]];
  }
  return makStateGetter(keys.slice(1))(state[keys[0]]);
};

/**
 * 状态管理模型
 */
class Model {
  constructor(namespace) {
    const selft = this;

    this.namespace = namespace; // 命名空间
    this.namespaceKeys = namespace.split('/');
    this.types = {}; // 动作类型
    this.actions = {}; // 动作创建器
    this.selectors = {}; // 状态选择器

    const { reducers, defaultState } = extractReducers(this);
    const effects = extractGeneratorFunctions(this);
    const actionKeys = [
      ...Object.keys(effects || {}),
      ...Object.keys(reducers || {}),
    ];
    actionKeys.forEach(key => {
      const reducer = reducers[key];
      if (key.indexOf(TYPE_DIVIDED_SYMBOLS) >= 0) {
        // 非当前命名空间下的 action
        const type = key;
        if (reducer) {
          reducers[type] = reducer;
        }
      } else {
        const type = makeType(namespace, key);
        this.types[key] = type;
        if (!this.actions[key]) {
          this.actions[key] = makeActionCreator(type).bind(selft);
        }
        if (reducer) {
          reducers[type] = reducer;
        }
      }
    });

    this.defaultState = defaultState; // 默认状态
    // 副作用函数
    this.tasks = {}; // 副作用非阻塞任务
    this.watcher = {}; // Action 监视器
    this.effect = function* effect() {
      const keys = Object.keys(effects || {});
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        const type =
          key.indexOf(TYPE_DIVIDED_SYMBOLS) >= 0
            ? key
            : makeType(namespace, key);
        const effectFunc = effects[key].bind(selft);
        const callEffectFunc = function*(...args) {
          yield call(effectFunc, ...args);
          selft.tasks[key] = null;
        };
        const folkEffectFunc = function*(...args) {
          selft.tasks[key] = yield fork(callEffectFunc, ...args);
        };
        const watcher = function*() {
          yield takeEvery(type, folkEffectFunc);
        };
        selft[key] = folkEffectFunc;
        selft.watcher[key] = yield fork(watcher);
      }
    };
    // 状态处理
    this.reduce = (state = defaultState, action) => {
      const reduceProcess = reducers[action.type];
      if (typeof reduceProcess === 'function') {
        return reduceProcess(state, action);
      }
      return state;
    };

    this.getState = makStateGetter(this.namespaceKeys);
  }

  *cancel({ payload: ignore }) {
    try {
      const taskKeys = Object.keys(this.tasks);
      for (let i = taskKeys.length - 1; i >= 0; i -= 1) {
        const key = taskKeys[i];
        const task = this.tasks[key];
        if (key !== ignore && task) {
          yield cancel(task);
        }
      }
    } catch (error) {
      // eslint-disable-next-line
      console.error(error);
    }
  }

  *destroy() {
    try {
      const watcherKeys = Object.keys(this.watcher);
      for (let i = watcherKeys.length - 1; i >= 0; i -= 1) {
        const watcher = this.watcher[watcherKeys[i]];
        if (watcher) {
          yield cancel(watcher);
        }
      }
      const taskKeys = Object.keys(this.tasks);
      for (let i = taskKeys.length - 1; i >= 0; i -= 1) {
        const task = this.tasks[taskKeys[i]];
        if (task) {
          yield cancel(task);
        }
      }
    } catch (error) {
      // eslint-disable-next-line
      console.error(error);
    }
  }
}

export default Model;
