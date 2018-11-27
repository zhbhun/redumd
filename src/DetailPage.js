import { call, put, select } from 'redux-saga/effects';
import Page from './Page';

/**
 * 详情页面模型，用于维护指定 ID 的业务详情数据
 */
class DetailPage extends Page {
  /**
   * 默认状态
   * @static
   * @property {string} id
   * @property {Object} initiate
   * @property {string} initiate.error
   * @property {boolean} initiate.loading
   */
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
   * @param {string} namespace 命名空间
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
    /**
     * 获取业务 ID
     * @param state
     */
    this.getId = state => this.getState(state).id;
    /**
     * 获取初始化状态
     * @param state
     */
    this.getInitiate = state => this.getState(state).initiate;
    /**
     * 是否初始化
     * @param state
     */
    this.isInitiated = state => {
      const data = this.getDetail(state);
      return !!data && Object.keys(data).length > 0;
    };
    /**
     * 获取业务详情数据
     * @param state
     */
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
