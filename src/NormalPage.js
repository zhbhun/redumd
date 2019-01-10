import { call, put, select } from 'redux-saga/effects';
import Page from './Page';

class NormalPage extends Page {
  static defaultState = {
    params: null, // 查询参数
    initiate: {
      error: null, // 初始化错误
      message: null, // 初始化信息
      loading: false, // 初始化加载中
    },
    data: null, // 数据
  };

  static reducers = {
    initiateRequest(state, { payload: params }) {
      return {
        ...state,
        params,
        initiate: {
          error: null,
          message: null,
          loading: true,
        },
      };
    },
    initiateFailure(state, { payload: error }) {
      return {
        ...state,
        initiate: {
          error: error && error.code ? error.code : -1,
          message: error && error.message ? error.message : '加载失败了',
          loading: false,
        },
      };
    },
    initiateSuccess(state, { payload: data }) {
      return {
        ...state,
        initiate: {
          error: null,
          message: null,
          loading: false,
        },
        data,
      };
    },
  };

  /**
   * @param {String} namespace 命名空间
   * @param {Object} options 参数配置
   * @param {function} options.api API 接口，用于请求对应的业务数据
   */
  constructor(namespace, { api }) {
    super(namespace);

    // options
    this.api = api;

    // selectors
    this.getParams = state => this.getState(state).params;
    this.getInitiate = state => this.getState(state).initiate;
    this.getData = state => this.getState(state).data;
    this.isInitiated = state => !!this.getData(state);
  }

  *initiate(action) {
    try {
      const { loading } = yield select(this.getInitiate);
      if (loading) {
        return;
      }
      yield put(this.actions.initiateRequest(action.payload));
      const { data } = yield call(this.api, action.payload, action.meta);
      yield put(this.actions.initiateSuccess(data));
    } catch (err) {
      yield put(this.actions.initiateFailure(err));
    }
  }

  *initiateIfNeed(action) {
    const isInitiated = yield select(this.isInitiated);
    if (!isInitiated) {
      yield put(this.actions.initiate(action.payload, action.meta));
    }
  }

  *refresh(action) {
    const payload = yield select(this.getParams);
    yield put(this.actions.initiate(action.payload || payload, action.meta));
  }
}

export default NormalPage;
