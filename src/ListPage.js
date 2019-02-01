import { call, cancel, cancelled, put, select } from 'redux-saga/effects';
import Entities from './Entities';
import Page from './Page';

class ListPage extends Page {
  static defaultState = {
    params: null, // 查询参数
    invalidate: true, // 缓存数据是否有效
    initiate: {
      error: null, // 初始化错误
      message: null, // 初始化信息
      loading: false, // 初始化加载中
    },
    loadMore: {
      error: null, // 分页加载错误
      message: null, // 分页加载信息
      loading: false, // 分页加载中
    },
    meta: {
      page: 1, // 分页
      hasMore: false, // 是否有更多数据
    },
    data: null, // 分页数据
    extras: null, // 额外数据
  };

  static reducers = {
    invalidate(state) {
      return {
        ...state,
        invalidate: true,
      };
    },
    updateExtrasSuccess(state, { payload: extras }) {
      return {
        ...state,
        extras,
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
      return {
        ...state,
        initiate: {
          error: error && error.code ? error.code : -1,
          message: error && error.message ? error.message : '加载失败了',
          loading: false,
        },
      };
    },
    initiateSuccess(state, { payload: data, meta }) {
      return {
        ...state,
        invalidate: false,
        initiate: {
          error: null,
          message: null,
          loading: false,
        },
        meta: {
          ...state.meta,
          ...meta,
        },
        data,
      };
    },
    loadMoreRequest(state) {
      return {
        ...state,
        loadMore: {
          error: null,
          message: null,
          loading: true,
        },
      };
    },
    loadMoreFailure(state, { payload: error }) {
      return {
        ...state,
        loadMore: {
          error: error && error.code ? error.code : -1,
          message: error && error.message ? error.message : '加载失败了',
          loading: false,
        },
      };
    },
    loadMoreSuccess(
      state,
      {
        payload: { meta, data },
      }
    ) {
      return {
        ...state,
        loadMore: {
          error: null,
          message: null,
          loading: false,
        },
        meta: {
          ...state.meta,
          ...meta,
        },
        data: [...state.data, ...data],
      };
    },
  };

  /**
   * @param {String} namespace 命名空间
   * @param {Object} options 参数配置
   * @param {function} options.api API 接口，用于请求列表数据
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
    this.isInvalidate = state => this.getState(state).invalidate;
    this.getParams = state => this.getState(state).params;
    this.getMeta = state => this.getState(state).meta;
    this.getPage = state => this.getMeta(state).page;
    this.hasMore = state => this.getMeta(state).hasMore;
    this.getData = state => this.getState(state).data || [];
    this.getExtras = state => this.getState(state).extras;
    this.getInitiate = state => this.getState(state).initiate;
    this.getLoadMore = state => this.getState(state).loadMore;
    this.isInitiated = state => {
      const data = this.getState(state).data;
      return !!data && data.length > 0;
    };
  }

  *updateExtras({ payload: extras }) {
    if (extras !== undefined) {
      yield put(this.actions.updateExtrasSuccess(extras));
    }
  }

  *initiate(action) {
    try {
      const { loading } = yield select(this.getInitiate);
      if (loading) {
        return;
      }
      if (this.tasks.loadMore) {
        // 避免同时进行更多数据请求和刷新请求（思考：同时请求，刷新接口先响应时分页加载数据会附加到刷新后的数据中）
        yield cancel(this.tasks.loadMore);
      }
      yield put(this.actions.initiateRequest(action.payload));
      const { data, meta, extras } = yield call(
        this.api,
        1,
        action.payload,
        action.meta
      );
      const entities = this.schema.create(data);
      yield put(this.entities.actions.append(entities));
      if (extras !== undefined) {
        yield call(this.updateExtras, { payload: extras });
      }
      yield put(
        this.actions.initiateSuccess(this.schema.getResult(entities), meta)
      );
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

  *loadMore() {
    try {
      const hasMore = yield select(this.hasMore);
      if (!hasMore) {
        return;
      }
      const { loading: initiating } = yield select(this.getInitiate);
      if (initiating) {
        return;
      }
      const { loading: moreLoading } = yield select(this.getLoadMore);
      if (moreLoading) {
        return;
      }
      const params = yield select(this.getParams);
      yield put(this.actions.loadMoreRequest());
      const page = yield select(this.getPage);
      const { data, meta } = yield call(this.api, page + 1, params);
      const entities = this.schema.create(data);
      yield put(this.entities.actions.append(entities));
      yield put(
        this.actions.loadMoreSuccess({
          meta: {
            ...meta,
            page: meta.page || page + 1,
          },
          data: this.schema.getResult(entities),
        })
      );
    } catch (err) {
      yield put(this.actions.loadMoreFailure(err));
    } finally {
      if (yield cancelled()) {
        yield put(this.actions.loadMoreFailure(null));
      }
    }
  }

  *refresh(action) {
    const payload = yield select(this.getParams);
    yield put(this.actions.initiate(action.payload || payload, action.meta));
  }
}

export default ListPage;
