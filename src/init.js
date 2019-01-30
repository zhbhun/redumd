import merge from 'lodash.mergewith';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { all, call } from 'redux-saga/effects';
import Entities from './Entities';

let composeEnhancers = compose;
if (process.env.NODE_ENV !== 'production') {
  const { composeWithDevTools } = require('redux-devtools-extension');
  composeEnhancers = composeWithDevTools;
}
const entities = Entities.instance;
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
 * @param {object} config
 * @param {object} config.reducers
 * @param {object|array} config.preloadedState
 * @param {array} config.middlewares
 * @param {array} config.enhancers
 * @param {function} config.effect
 * @param {array} config.models
 * @param {object} config.entities
 */
const init = config => {
  // model
  const models = [...(config.models || []), config.entities || entities];
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
    unmodel(rmModels) {
      let hasChange = false;
      const rmModelsArray = Array.isArray(rmModels) ? rmModels : [rmModels];
      rmModelsArray.forEach(item => {
        if (modelsMap[item.namespace]) {
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
