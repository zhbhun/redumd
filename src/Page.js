import Model from './Model';

class Page extends Model {
  constructor(namespace) {
    super(`@PAGE/${namespace}`);
  }
}

export default Page;
