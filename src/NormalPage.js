import { call, put, select } from 'redux-saga/effects';
import Page from './Page';

class NormalPage extends Page {
  static defaultState = {
    params: null, // 查询参数
    invalidate: true, // 缓存数据是否有效
    initiate: {
      error: null, // 初始化错误
      message: null, // 初始化信息
      loading: false, // 初始化加载中
    },
    data: null, // 数据
  };

  static reducers = {
    invalidate(state) {
      return {
        ...state,
        invalidate: true,
      };
    },
    initiateDataSuccess(state, { payload: data }) {
      return {
        ...state,
        data,
      };
    },
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
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line
        console.log(error);
      }
      return {
        ...state,
        initiate: {
          error: error && error.code ? error.code : -1,
          message: error && error.message ? error.message : '加载失败了',
          loading: false,
        },
      };
    },
    initiateSuccess(state) {
      return {
        ...state,
        invalidate: false,
        initiate: {
          error: null,
          message: null,
          loading: false,
        },
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
    this.isInvalidate = state => this.getState(state).invalidate;
    this.getParams = state => this.getState(state).params;
    this.getInitiate = state => this.getState(state).initiate;
    this.getData = state => this.getState(state).data;
    this.isInitiated = state => !!this.getData(state);
  }

  *initiateData({ payload: data }) {
    if (data !== undefined) {
      yield put(this.actions.initiateDataSuccess(data));
    }
  }

  *initiate(action) {
    try {
      const { loading } = yield select(this.getInitiate);
      if (loading) {
        return;
      }
      yield put(this.actions.initiateRequest(action.payload));
      const { data } = yield call(this.api, action.payload, action.meta);
      yield put(this.actions.initiateData(data));
      yield put(this.actions.initiateSuccess());
    } catch (err) {
      yield put(this.actions.initiateFailure(err));
    }
  }

  *initiateIfNeed(action) {
    const isInvalidate = yield select(this.isInvalidate);
    if (isInvalidate) {
      yield put(this.actions.initiate(action.payload, action.meta));
    }
  }

  *refresh(action) {
    const payload = yield select(this.getParams);
    yield put(this.actions.initiate(action.payload || payload, action.meta));
  }
}

export default NormalPage;
