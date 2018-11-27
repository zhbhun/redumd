import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { all, call } from 'redux-saga/effects';
import Entities from './Entities';

let composeEnhancers = compose;
if (process.env.NODE_ENV !== 'production') {
  const { composeWithDevTools } = require('redux-devtools-extension');
  composeEnhancers = composeWithDevTools;
}
const entities = new Entities();

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
  let reducers = { ...(config.reducers || {}) };
  const models = [...(config.models || []), config.entities || entities];
  const modelsMap = {};

  // reducers
  models.forEach(model => {
    reducers[model.namespace] = model.reduce;
    modelsMap[model.namespace] = model;
  });
  const mergeReducers = (nextReducers = {}) => {
    reducers = { ...reducers, ...nextReducers };
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
     * @param {array} models
     */
    model(newModels) {
      if (typeof newModels === 'string') {
        return modelsMap[newModels];
      }
      const modelReducers = {};
      (Array.isArray(newModels) ? newModels : [newModels]).forEach(item => {
        if (!reducers[item.namespace]) {
          models.push(item);
          modelReducers[item.namespace] = item.reduce;
          modelsMap[item.namespace] = item;
          sagaMiddleware.run(item.effect);
        }
      });
      store.replaceReducer(mergeReducers(modelReducers));
      return newModels;
    },
    unmodel(rmModels) {
      (Array.isArray(rmModels) ? rmModels : [rmModels]).forEach(item => {
        if (reducers[item.namespace]) {
          const index = models.indexOf(item);
          store.dispatch(item.actions.destroy());
          models.splice(index, 1);
          reducers[item.namespace] = undefined;
          delete reducers[item.namespace];
          modelsMap[item.namespace] = undefined;
          delete modelsMap[item.namespace];
        }
      });
      store.replaceReducer(combineReducers(reducers));
    },
  };
};

export { entities };

export default init;
