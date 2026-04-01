import { TaskStatus } from './task-status.vo';

describe('TaskStatus', () => {
  it('allows todo -> in-progress', () => {
    const status = new TaskStatus('todo');

    expect(status.transitionTo('in-progress').current).toBe('in-progress');
  });

  it('allows in-progress -> done', () => {
    const status = new TaskStatus('in-progress');

    expect(status.transitionTo('done').current).toBe('done');
  });

  it('rejects todo -> done', () => {
    const status = new TaskStatus('todo');

    expect(() => status.transitionTo('done')).toThrow(
      'Invalid transition: todo -> done',
    );
  });
});
