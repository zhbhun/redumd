import {
  Schema as NormalizrSchema,
  EntityOptions as NormalizrEntityOptions
} from "normalizr";
import { Reducer, Action, ReducersMapObject, Store } from "redux";
import { Effect } from "redux-saga";

export interface ModelAction<P, M> extends Action {
  payload?: P;
  meta?: M;
}

export type ModelActionCreator<P = any, M = any> = (
  payload?: P,
  meta?: M
) => ModelAction<P, M>;

export type ModelReducer<S = any, P = any, M = any> = Reducer<
  S,
  ModelAction<P, M>
>;

export type ModelReducersMapObject<
  S = any,
  P = any,
  M = any
> = ReducersMapObject<S, ModelAction<P, M>>;

export type ModelSelector<S = any, T = any> = (state, params?: T) => S;

export type ModelEffect<P = any, M = any> = (action: ModelAction<P, M>) => void;

declare class Schema<T> {
  constructor(
    key: string | symbol,
    definition?: NormalizrSchema,
    options?: NormalizrEntityOptions<T>
  );

  protected entities: Entities;

  /**
   * 获取 Key 值
   */
  getKey: () => string | symbol;

  /**
   * 获取当前 schema 对应所有实体状态合集，entities 参数可以是 store 全局状体（自动通过 Entities 单例从全局状态获取 entities 状态），也可以直接传 entities 状态
   */
  getEntities: (entities: any) => any;

  /**
   * 获取某个 normalizr entities 对应的 id 集合
   */
  getResult: (entities: any) => any;

  /**
   * 获取指定 ID 的实体数据
   */
  getEntity: (entities: any, id: any) => any;

  /**
   * 创建实体数据，可以是数组或者对象
   */
  create: (data: any) => any;
}

declare abstract class Model<S> {
  static namespace: string;
  static reducers: ModelReducersMapObject;

  namespace: string;
  types: { [key: string]: string };
  actions: {
    [key: string]: <P = any, M = any>(
      payload?: P,
      meta?: M
    ) => ModelAction<P, M>;
  };
  tasks: { [key: string]: Effect };
  getState: (state: any) => S;
  // 内部使用
  protected watcher: { [key: string]: Effect };
  protected reducer: Function;
  protected cancel: Function;
  protected destroy: Function;

  constructor(namespace: string);
}

export interface EntitiesState {
  [key: string]: any;
}

declare abstract class Entities extends Model<EntitiesState> {
  static reducers: {
    reset: ModelReducer<EntitiesState>;
    prepend: ModelReducer<EntitiesState>;
    append: ModelReducer<EntitiesState>;
    update: ModelReducer<EntitiesState>;
    remove: ModelReducer<EntitiesState>;
  };

  static getInstance: () => Entities;
  static setInstance: (instance: Entities) => void;

  getEntities: ModelSelector;
}

declare abstract class Page<S> extends Model<S> {}

export interface LoadStatus {
  /**
   * 错误码
   */
  error: number; //
  /**
   * 错误信息
   */
  message: string;
  /**
   * 加载中
   */
  loading: boolean;
}

export interface ListPageState<E = any> {
  /**
   * 查询参数
   */
  params: any;
  /**
   * 缓存数据是否有效
   */
  invalidate: boolean;
  /**
   * 初始化
   */
  initiate: LoadStatus;
  /**
   * 加载更多
   */
  loadMore: LoadStatus;
  /**
   * 元信息
   */
  meta: {
    /**
     * 分页
     */
    page: number | string;
    /**
     * 是否有更多数据
     */
    hasMore: false;
  };
  /**
   * 数据列表
   */
  data: number[]; // 分页数据
  /**
   * 其他数据
   */
  extras: E; // 额外数据
}

export interface ListPageOptions {
  api: Function;
  entities?: any;
  schema: any;
  nextpage?: (page: any) => any;
}

export interface ListPageTypes {
  invalidate: string;
  initiate: string;
  initiateIfNeed: string;
  initiateRequest: string;
  initiateFailure: string;
  initiateSuccess: string;
  initiateExtras: string;
  initiateExtrasSuccess: string;
  loadMore: string;
  loadMoreRequest: string;
  loadMoreFailure: string;
  loadMoreCancel: string;
  loadMoreSuccess: string;
  refresh: string;
}

export interface ListPageActions {
  invalidate: ModelActionCreator;
  initiateIfNeed: ModelActionCreator;
  initiate: ModelActionCreator;
  loadMore: ModelActionCreator;
  refresh: ModelActionCreator;
}

declare abstract class ListPage<
  E = any,
  S extends ListPageState<E> = any
> extends Page<S> {
  // state
  public static defaultState: ListPageState;

  // reducers
  public static reducers: {
    invalidate: ModelReducer<ListPageState>;
    initiateRequest: ModelReducer<ListPageState>;
    initiateFailure: ModelReducer<ListPageState>;
    initiateSuccess: ModelReducer<ListPageState>;
    initiateExtrasSuccess: ModelReducer<ListPageState>;
    loadMoreRequest: ModelReducer<ListPageState>;
    loadMoreFailure: ModelReducer<ListPageState>;
    loadMoreCancel: ModelReducer<ListPageState>;
    loadMoreSuccess: ModelReducer<ListPageState>;
  };

  // constructor
  constructor(namespace, options: ListPageOptions);

  // member
  protected api: ListPageOptions["api"];
  protected entities: ListPageOptions["entities"];
  protected schema: ListPageOptions["schema"];
  protected nextpage: ListPageOptions["nextpage"];

  // types
  public types: ListPageTypes;

  // actions
  public actions: ListPageActions;

  // selector
  public isInvalidate: ModelSelector<boolean>;
  public getParams: ModelSelector;
  public getMeta: ModelSelector;
  public getPage: ModelSelector;
  public hasMore: ModelSelector<boolean>;
  public getData: ModelSelector<number[]>;
  public getExtras: ModelSelector<E>;
  public getInitiate: ModelSelector<LoadStatus>;
  public getLoadMore: ModelSelector<LoadStatus>;
  public isInitiated: ModelSelector<boolean>;

  // effec
  protected initiateExtras: ModelEffect;
  protected initiate: ModelEffect;
  protected initiateIfNeed: ModelEffect;
  protected loadMore: ModelEffect;
  protected refresh: ModelEffect;
}

export interface DetailPageState<E = any> {
  /**
   * 业务 ID
   */
  id: any;
  /**
   * 缓存数据是否有效
   */
  invalidate: boolean;
  /**
   * 初始化
   */
  initiate: LoadStatus;
  extras: E; // 额外数据
}

export interface DetailPageOptions {
  api: Function;
  entities?: any;
  schema: any;
}

export interface DetailPageTypes {
  reset: string;
  invalidate: string;
  initiate: string;
  initiateIfNeed: string;
  initiateRequest: string;
  initiateFailure: string;
  initiateSuccess: string;
  initiateExtras: string;
  initiateExtrasSuccess: string;
  refresh: string;
}

export interface DetailPageActions {
  reset: ModelActionCreator;
  invalidate: ModelActionCreator;
  initiateIfNeed: ModelActionCreator;
  initiate: ModelActionCreator;
  refresh: ModelActionCreator;
}

declare abstract class DetailPage<
  E = any,
  S extends DetailPageState<E> = any
> extends Page<S> {
  // state
  public static defaultState: DetailPageState;

  public static reducers: {
    reset: ModelReducer<ListPageState>;
    invalidate: ModelReducer<ListPageState>;
    initiateRequest: ModelReducer<ListPageState>;
    initiateFailure: ModelReducer<ListPageState>;
    initiateSuccess: ModelReducer<ListPageState>;
    initiateExtrasSuccess: ModelReducer<ListPageState>;
  };

  constructor(namespace, options: DetailPageOptions);

  protected api: ListPageOptions["api"];
  protected entities: ListPageOptions["entities"];
  protected schema: ListPageOptions["schema"];

  // types
  public types: DetailPageTypes;

  // actions
  public actions: DetailPageActions;

  public isInvalidate: ModelSelector<boolean>;
  public getId: ModelSelector;
  public getInitiate: ModelSelector<LoadStatus>;
  public isInitiated: ModelSelector<boolean>;
  public getDetail: ModelSelector;
  public getExtras: ModelSelector<E>;

  protected initiateExtras: ModelEffect;
  protected initiate: ModelEffect;
  protected initiateIfNeed: ModelEffect;
  protected refresh: ModelEffect;
}

export interface NormalPageState<D = any> {
  /**
   * 参数
   */
  params: any;
  /**
   * 缓存数据是否有效
   */
  invalidate: boolean;
  /**
   * 初始化
   */
  initiate: LoadStatus;
  /**
   * 数据
   */
  data: D;
}

export interface NormalPageOptions {
  api: Function;
}

export interface NormalPageTypes {
  invalidate: string;
  initiate: string;
  initiateIfNeed: string;
  initiateRequest: string;
  initiateFailure: string;
  initiateSuccess: string;
  initiateData: string;
  refresh: string;
}

export interface NormalPageActions {
  invalidate: ModelActionCreator;
  initiate: ModelActionCreator;
  initiateIfNeed: ModelActionCreator;
  refresh: ModelActionCreator;
}

declare abstract class NormalPage<
  D = any,
  S extends NormalPageState<D> = any
> extends Page<S> {
  // state
  public static defaultState: NormalPageState;

  public static reducers: {
    invalidate: ModelReducer<ListPageState>;
    initiateRequest: ModelReducer<ListPageState>;
    initiateFailure: ModelReducer<ListPageState>;
    initiateSuccess: ModelReducer<ListPageState>;
  };

  constructor(namespace, options: DetailPageOptions);

  protected api: ListPageOptions["api"];

  // types
  public types: NormalPageTypes;

  // actions
  public actions: NormalPageActions;

  public isInvalidate: ModelSelector<boolean>;
  public getParams: ModelSelector;
  public getInitiate: ModelSelector<LoadStatus>;
  public isInitiated: ModelSelector<boolean>;
  public getData: ModelSelector<D>;

  protected initiateData: ModelEffect;
  protected initiate: ModelEffect;
  protected initiateIfNeed: ModelEffect;
  protected refresh: ModelEffect;
}

export interface InitOptions {
  reducers?: any;
  preloadedState?: any;
  middlewares?: any;
  enhancers?: any;
  effect?: Function;
  models?: any;
  entities?: Entities;
  devtool?: any;
}

export interface App extends Store {
  model: (models: any) => void;
  unmode: (models: any) => void;
  runSagaTask: () => null;
}

declare const init = (options: InitOptions) => App;

export {
  init,
  Schema,
  Model,
  Entities,
  Page,
  ListPage,
  DetailPage,
  NormalPage
};
