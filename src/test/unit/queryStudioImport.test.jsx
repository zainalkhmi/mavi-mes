import { describe, it, expect } from 'vitest';
import QueryStudio from '../../components/QueryStudio.jsx';

describe('QueryStudio component import test', () => {
  it('imports QueryStudio without errors', () => {
    expect(QueryStudio).toBeDefined();
  });
});
