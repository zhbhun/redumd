import { call, cancel, cancelled, put, select } from 'redux-saga/effects';
import Page from './Page';

class ListPage extends Page {
  static defaultState = {
    initiate: {
      error: null, // 初始化错误信息
      loading: false, // 初始化加载中
    },
    loadMore: {
      error: null, // 分页加载错误信息
      loading: false, // 分页加载中
    },
    meta: {
      page: 1, // 分页
      hasMore: false, // 是否有更多数据
    },
    data: null, // 分页数据
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
    initiateSuccess(
      state,
      {
        payload: { meta, data },
      }
    ) {
      return {
        ...state,
        initiate: {
          error: null,
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
          loading: true,
        },
      };
    },
    loadMoreFailure(state, { payload }) {
      return {
        ...state,
        loadMore: {
          error: payload,
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
    this.entities = entities;
    this.schema = schema;

    // selectors
    this.getMeta = state => this.getState(state).meta;
    this.getPage = state => this.getMeta(state).page;
    this.hasMore = state => this.getMeta(state).hasMore;
    this.getData = state => this.getState(state).data || [];
    this.getInitiate = state => this.getState(state).initiate;
    this.getLoadMore = state => this.getState(state).loadMore;
    this.isInitiated = state => {
      const data = this.getState(state).data;
      return !!data && data.length > 0;
    };
  }

  *initiate({ payload }) {
    try {
      const { loading } = yield select(this.getInitiate);
      if (loading) {
        return;
      }
      if (this.tasks.loadMore) {
        // 避免同时进行更多数据请求和刷新请求（思考：同时请求，刷新接口先响应时分页加载数据会附加到刷新后的数据中）
        yield cancel(this.tasks.loadMore);
      }
      yield put(this.actions.initiateRequest());
      const { data, meta, ...others } = yield call(this.api, 1, payload);
      const entities = this.schema.create(data);
      yield put(this.entities.actions.append(entities));
      yield put(
        this.actions.initiateSuccess({
          meta,
          data: this.schema.getResult(entities),
          others,
        })
      );
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

  *loadMore({ payload }) {
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
      yield put(this.actions.loadMoreRequest());
      const page = yield select(this.getPage);
      const { data, meta, ...others } = yield call(this.api, page + 1, payload);
      const entities = this.schema.create(data);
      yield put(this.entities.actions.append(entities));
      yield put(
        this.actions.loadMoreSuccess({
          meta: {
            ...meta,
            page: meta.page || page + 1,
          },
          data: this.schema.getResult(entities),
          others,
        })
      );
    } catch (err) {
      yield put(this.actions.loadMoreFailure(err.message));
    } finally {
      if (yield cancelled()) {
        yield put(this.actions.loadMoreFailure(null));
      }
    }
  }
}

export default ListPage;
