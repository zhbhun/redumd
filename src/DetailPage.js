import { call, put, select } from 'redux-saga/effects';
import Entities from './Entities';
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
    invalidate: true, // 缓存数据是否有效
    initiate: {
      error: null, // 初始化错误
      message: null, // 初始化信息
      loading: false, // 初始化加载中
    },
    extras: null, // 额外数据
  };

  static reducers = {
    reset(state, { payload }) {
      return payload;
    },
    invalidate(state) {
      return {
        ...state,
        invalidate: true,
      };
    },
    initiateRequest(state, { payload }) {
      return {
        ...state,
        id: payload,
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
    initiateSuccess(state, { payload: extras }) {
      return {
        ...state,
        invalidate: false,
        initiate: {
          error: null,
          message: null,
          loading: false,
        },
        extras,
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
    this.entities = entities || Entities.getInstance();
    this.schema = schema;

    // selectors
    /**
     * 缓存数据是否无效
     */
    this.isInvalidate = state => this.getState(state).invalidate;
    /**
     * 获取业务 ID
     * @param {Object} state
     */
    this.getId = state => this.getState(state).id;
    /**
     * 获取初始化状态
     * @param {Object} state
     */
    this.getInitiate = state => this.getState(state).initiate;
    /**
     * 是否初始化
     * @param {Object} state
     */
    this.isInitiated = state => {
      const data = this.getDetail(state);
      return !!data && Object.keys(data).length > 0;
    };
    /**
     * 获取业务详情数据
     * @param {Object} state
     */
    this.getDetail = state => this.schema.getEntity(state, this.getId(state));
    /**
     * 获取额外数据
     * @param {Object} state
     */
    this.getExtras = state => this.getState(state).extras;
  }

  *initiate(action) {
    try {
      // 根据 ID 是否变化来重置状态
      const currId = yield select(this.getId);
      if (currId && currId !== action.payload) {
        yield put(this.actions.cancel('initiate'));
        yield put(this.actions.reset(this.defaultState));
      }
      // 避免重复加载
      const { loading } = yield select(this.getInitiate);
      if (loading) {
        return;
      }
      // 加载数据
      yield put(this.actions.initiateRequest(action.payload));
      const { data, extras } = yield call(
        this.api,
        action.payload,
        action.meta
      );
      yield put(this.entities.actions.append(data, this.schema));
      yield put(this.actions.initiateSuccess(extras || null));
    } catch (err) {
      yield put(this.actions.initiateFailure(err));
    }
  }

  *initiateIfNeed(action) {
    // 根据 ID 是否变化来重置状态
    const id = yield select(this.getId);
    if (id && id !== action.payload) {
      yield put(this.actions.cancel('initiateIfNeed'));
      yield put(this.actions.reset(this.defaultState));
    }
    const isInvalidate = yield select(this.isInvalidate);
    if (isInvalidate) {
      yield put(this.actions.initiate(action.payload, action.meta));
    }
  }

  *refresh(action) {
    const id = yield select(this.getId);
    if (action.payload || id) {
      yield put(this.actions.initiate(action.payload || id, action.meta));
    }
  }
}

export default DetailPage;
