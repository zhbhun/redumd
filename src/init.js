import merge from 'lodash.mergewith';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { all, call } from 'redux-saga/effects';
import Entities from './Entities';

const getComposeEnhancers = devtool => {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof window !== 'undefined') {
      const { composeWithDevTools } = require('redux-devtools-extension');
      return composeWithDevTools(devtool || {});
    }
  }
  return compose;
};

const combineDeepReducers = reducersMap => {
  const result = {};
  const reducerMapKeys = Object.keys(reducersMap);
  for (let i = reducerMapKeys.length - 1; i >= 0; i -= 1) {
    const key = reducerMapKeys[i];
    const reducer = reducersMap[key];
    if (typeof reducer === 'object') {
      result[key] = combineReducers(combineDeepReducers(reducer));
    } else {
      result[key] = reducer;
    }
  }
  return result;
};

/**
 * @param {Object} config
 * @param {Object} config.reducers
 * @param {Object|Array} config.preloadedState
 * @param {Array} config.middlewares
 * @param {Array} config.enhancers
 * @param {Function} config.effect
 * @param {Array} config.models
 * @param {Object} config.entities
 * @param {Object} config.devtool
 */
const init = config => {
  // config
  if (config.entities) {
    Entities.setInstance(config.entities);
  }
  // model
  const models = [
    ...(config.models || []),
    config.entities || Entities.getInstance(),
  ];
  const modelsMap = {};
  models.forEach(model => {
    modelsMap[model.namespace] = model;
  });

  // reducer
  const mergeReducers = (nextReducers = {}) => {
    const modelReducers = {};
    const modelMap = {};
    for (let i = models.length - 1; i >= 0; i -= 1) {
      const model = models[i];
      const { namespace, reducer } = model;
      const keys = namespace.split('/');
      if (keys.length >= 2) {
        let object = reducer;
        for (let j = keys.length - 1; j >= 0; j -= 1) {
          const key = keys[j];
          object = { [key]: object };
        }
        merge(modelMap, object);
      } else {
        modelReducers[namespace] = reducer;
      }
    }
    const reducers = Object.assign(
      combineDeepReducers(modelMap),
      modelReducers,
      config.reducers,
      nextReducers
    );
    if (Object.keys(reducers).length === 0) {
      return state => state;
    }
    return combineReducers(reducers);
  };

  // middlewares
  const sagaMiddleware = createSagaMiddleware();
  const middlewares = [sagaMiddleware, ...(config.middlewares || [])];

  // store
  const composeEnhancers = getComposeEnhancers(config.devtool);
  const store = createStore(
    mergeReducers(),
    config.preloadedState,
    composeEnhancers(
      applyMiddleware(...middlewares),
      ...(config.enhancer || [])
    )
  );

  // effect
  store.runSagaTask = () => {
    store.sagaTask = sagaMiddleware.run(function*() {
      const effects = [
        ...(config.effect ? [config.effect] : []),
        ...models.map(model => model.effect),
      ];
      yield all(effects.map(effect => call(effect)));
    });
  };
  store.runSagaTask();

  return {
    ...store,
    /**
     * @param {array|string} models 如果为字符串则返回对应的 model 实例，否则必须是对象且合并到现有的 model 集合中
     */
    model(newModels) {
      if (typeof newModels === 'string') {
        return modelsMap[newModels];
      }
      let hasChange = false;
      const newModelsArray = Array.isArray(newModels) ? newModels : [newModels];
      newModelsArray.forEach(item => {
        const preModel = modelsMap[item.namespace];
        if (
          !preModel ||
          // 热加载时 Model 类可能会发生变化
          Object.getPrototypeOf(preModel).constructor !==
            Object.getPrototypeOf(item).constructor
        ) {
          hasChange = true;
          models.push(item);
          modelsMap[item.namespace] = item;
          sagaMiddleware.run(item.effect);
        }
      });
      if (hasChange) {
        store.replaceReducer(mergeReducers());
      }
      return newModels;
    },
    /**
     * @param {Object|Array.<Object>} rmModels
     */
    unmodel(rmModels) {
      let hasChange = false;
      const rmModelsArray = Array.isArray(rmModels) ? rmModels : [rmModels];
      rmModelsArray.forEach(item => {
        const curModel = modelsMap[item.namespace];
        if (
          curModel &&
          // 热加载时会更新路由页面，避免错误卸载了最新路由页面组件的 Model 配置
          Object.getPrototypeOf(curModel).constructor ===
            Object.getPrototypeOf(item).constructor
        ) {
          hasChange = true;
          const index = models.indexOf(item);
          store.dispatch(item.actions.destroy());
          models.splice(index, 1);
          modelsMap[item.namespace] = undefined;
          delete modelsMap[item.namespace];
        }
      });
      if (hasChange) {
        store.replaceReducer(mergeReducers());
      }
    },
  };
};

export default init;
