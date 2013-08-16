'''
Created on 2013-8-15

@author: zhouwenb
'''

import tornado.web
import tcomp
import handler

application = tornado.web.Application([
    (r"/chat/", handler.ChatHandler),
])

if __name__ == "__main__":
    application.listen(8888)
    tcomp.ioloop().start()