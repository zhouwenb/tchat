'''
Created on 2013-8-15

@author: zhouwenb
'''

import tornado_tulip
import tornado.web
from tornado.ioloop import IOLoop
import handler
IOLoop.configure(tornado_tulip.TulipIOLoop)

redis_server = {"host":"localhost"}

application = tornado.web.Application([
    (r"/chat/", handler.ChatHandler),
])

if __name__ == "__main__":
    application.listen(8888)
    IOLoop.instance().start()