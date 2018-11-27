import { call, put, select } from 'redux-saga/effects';
import Page from './Page';

class DetailPage extends Page {
  static defaultState = {
    id: null, // 业务 ID
    initiate: {
      error: null, // 初始化错误信息
      loading: false, // 初始化加载中
    },
  };

  static reducers = {
    initiateRequest(state, { payload }) {
      return {
        ...state,
        id: payload,
        initiate: {
          error: null,
          loading: true,
        },
      };
    },
    initiateFailure(state, { payload }) {
      return {
        ...state,
        initiate: {
          error: payload,
          loading: false,
        },
      };
    },
    initiateSuccess(state) {
      return {
        ...state,
        initiate: {
          error: null,
          loading: false,
        },
      };
    },
  };

  /**
   * @param {String} namespace 命名空间
   * @param {Object} options 参数配置
   * @param {function} options.api API 接口，用于请求对应 ID 的业务数据
   * @param {Object} options.entities Entities 实例，用于存储对应的业务状态
   * @param {Object} options.schema Schema 实例，用于查询对应的业务状态
   */
  constructor(namespace, { api, entities, schema }) {
    super(namespace);

    // options
    this.api = api;
    this.entities = entities;
    this.schema = schema;

    // selectors
    this.getId = state => this.getState(state).id;
    this.getInitiate = state => this.getState(state).initiate;
    this.isInitiated = state => {
      const data = this.getDetail(state);
      return !!data && Object.keys(data).length > 0;
    };
    this.getDetail = state =>
      this.schema.getEntity(this.entities.getState(state), this.getId(state));
  }

  *initiate({ payload: id }) {
    try {
      const { loading } = yield select(this.getInitiate);
      if (loading) {
        return;
      }
      yield put(this.actions.initiateRequest(id));
      const { data } = yield call(this.api, id);
      const entities = this.schema.create(data);
      yield put(this.entities.actions.append(entities));
      yield put(this.actions.initiateSuccess());
    } catch (err) {
      yield put(this.actions.initiateFailure(err.message));
    }
  }

  *initiateIfNeed({ payload }) {
    try {
      const isInitiated = yield select(this.isInitiated);
      if (!isInitiated) {
        yield put(this.actions.initiate(payload));
      }
    } catch (err) {
      // ignore
    }
  }
}

export default DetailPage;
