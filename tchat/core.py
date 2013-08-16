import tulip
import collections

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


def force_result(func):
    def task_wrapper(*args, **kwds):
        ret=func(*args, **kwds)
        if isinstance(ret, tulip.futures.Future):
            ret.add_done_callback(lambda future:future.result())
        return ret

    return task_wrapper
