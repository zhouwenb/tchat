import tulip
import collections
from tulip import Task
from tulip import futures
import inspect
Arguments = collections.namedtuple('Arguments', ['args', 'kwargs'])

class CallbackFuture(tulip.Future):
    def __init__(self, func, *args, **kwargs):
        super(CallbackFuture, self).__init__()
        def callback(*args_cb, **kwargs_cb):
            if kwargs_cb or len(args_cb) > 1:
                result = Arguments(args_cb, kwargs_cb)
            elif args_cb:
                result = args_cb[0]
            else:
                result = None
            self.set_result(result)
        if not "callback" in kwargs:
            kwargs["callback"] = callback
        func(*args, **kwargs)

def task(func):
    """Decorator for a coroutine to be wrapped in a Task."""
    if inspect.isgeneratorfunction(func):
        coro = func
    else:
        def coro(*args, **kw):
            res = func(*args, **kw)
            if isinstance(res, futures.Future) or inspect.isgenerator(res):
                res = yield from res
            return res

    def task_wrapper(*args, **kwds):
        return Task(coro(*args, **kwds))
    return task_wrapper