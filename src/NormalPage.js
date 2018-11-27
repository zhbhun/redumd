import { call, put, select } from 'redux-saga/effects';
import Page from './Page';

class NormalPage extends Page {
  static defaultState = {
    initiate: {
      error: null, // 初始化错误信息
      loading: false, // 初始化加载中
    },
    data: null, // 数据
  };

  static reducers = {
    initiateRequest(state) {
      return {
        ...state,
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
    initiateSuccess(state, payload) {
      return {
        ...state,
        initiate: {
          error: null,
          loading: false,
        },
        data: payload,
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
    this.getInitiate = state => this.getState(state).initiate;
    this.getData = state => this.getState(state).data;
  }

  *initiate() {
    try {
      const { loading } = yield select(this.getInitiate);
      if (loading) {
        return;
      }
      yield put(this.actions.initiateRequest());
      const { data } = yield call(this.api);
      yield put(this.actions.initiateSuccess(data));
    } catch (err) {
      yield put(this.actions.initiateFailure(err.message));
    }
  }
}

export default NormalPage;
