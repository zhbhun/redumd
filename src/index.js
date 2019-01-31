import Entities from './Entities';
import init from './init';
import Model from './Model';
import Page from './Page';
import DetailPage from './DetailPage';
import ListPage from './ListPage';
import NormalPage from './NormalPage';
import Schema from './Schema';

const entities = Entities.getInstance();

export {
  DetailPage,
  Entities,
  entities,
  init,
  ListPage,
  Model,
  NormalPage,
  Page,
  Schema,
};
