from tornado import stack_context
from tornado.ioloop import IOLoop
import collections
import datetime
import functools
import os
import tulip

Arguments = collections.namedtuple('Arguments', ['args', 'kwargs'])

def ioloop():
    return IOLoop.instance()

def force_result(func):
    def task_wrapper(*args, **kwds):
        ret=func(*args, **kwds)
        if isinstance(ret, tulip.Future):
            ret.add_done_callback(lambda future:future.result())
        return ret

    return task_wrapper

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


class TulipIOLoop(IOLoop):
    def initialize(self):
        self.tulip_loop = tulip.events.get_event_loop()
        # Maps fd to handler function (as in IOLoop.add_handler)
        self.handlers = {}
        # Maps fd to reader/writer tulip.events.Handler objects
        self.readers = {}
        self.writers = {}
        self.closing = False
 
    def close(self, all_fds=False):
        self.closing = True
        for fd in list(self.handlers):
            self.remove_handler(fd)
            if all_fds:
                os.close(fd)
        self.tulip_loop.close()
 
    def add_handler(self, fd, handler, events):
        if fd in self.handlers:
            raise ValueError("fd %d added twice" % fd)
        self.handlers[fd] = stack_context.wrap(handler)
        if events & IOLoop.READ:
            self.readers[fd] = self.tulip_loop.add_reader(
                fd, self._handle_events, fd, IOLoop.READ)
        if events & IOLoop.WRITE:
            self.writers[fd] = self.tulip_loop.add_writer(
                fd, self._handle_events, fd, IOLoop.WRITE)
 
    def update_handler(self, fd, events):
        if events & IOLoop.READ:
            if fd not in self.readers:
                self.readers[fd] = self.tulip_loop.add_reader(
                    fd, self._handle_events, fd, IOLoop.READ)
        else:
            if fd in self.readers:
                self.tulip_loop.remove_reader(fd)
                self.readers.pop(fd).cancel()
        if events & IOLoop.WRITE:
            if fd not in self.writers:
                self.writers[fd] = self.tulip_loop.add_writer(
                    fd, self._handle_events, fd, IOLoop.WRITE)
        else:
            if fd in self.writers:
                self.tulip_loop.remove_writer(fd)
                self.writers.pop(fd).cancel()
 
    def remove_handler(self, fd):
        if fd not in self.handlers:
            return
        if fd in self.readers:
            self.tulip_loop.remove_reader(fd)
            hd = self.readers.pop(fd)
            if hd: hd.cancel()
        if fd in self.writers:
            self.tulip_loop.remove_writer(fd)
            hd = self.writers.pop(fd)
            if hd: hd.cancel()
        del self.handlers[fd]
 
    def _handle_events(self, fd, events):
        try:
            self.handlers[fd](fd, events)
        except KeyError:
            print(fd, events)
            print('read', IOLoop.READ)
            import traceback
            print(''.join(traceback.format_stack()))
            raise
 
    def start(self):
        self.tulip_loop.run_forever()
 
    def stop(self):
        self.tulip_loop.stop()
 
    def _run_callback(self, callback, *args, **kwargs):
        try:
            callback(*args, **kwargs)
        except Exception:
            self.handle_callback_exception(callback)
 
    def add_timeout(self, deadline, callback):
        if isinstance(deadline, (int, float)):
            delay = max(deadline - self.time(), 0)
        elif isinstance(deadline, datetime.timedelta):
            delay = deadline.total_seconds()
        else:
            raise TypeError("Unsupported deadline %r", deadline)
        return self.tulip_loop.call_later(delay, self._run_callback,
                                          stack_context.wrap(callback))
 
    def remove_timeout(self, timeout):
        timeout.cancel()
 
    def add_callback(self, callback, *args, **kwargs):
        if self.closing:
            raise RuntimeError("IOLoop is closing")
        if kwargs:
            self.tulip_loop.call_soon_threadsafe(functools.partial(
                    self._run_callback, stack_context.wrap(callback),
                    *args, **kwargs))
        else:
            self.tulip_loop.call_soon_threadsafe(
                self._run_callback, stack_context.wrap(callback), *args)
 
    add_callback_from_signal = add_callback
