from tornado.ioloop import IOLoop
import tornado.web
import tornado.websocket
import tornado_tulip
import traceback
import tulip
import tulip_redis
import core
IOLoop.configure(tornado_tulip.TulipIOLoop)
redis_server={"host":"192.168.193.43"}

rc=tulip_redis.Client(**redis_server)
rc.connect()

class Member(object):
    def __init__(self, handler):
        super(Member, self).__init__()
        self.handler=handler
         
    def start_listen(self):
        self.client=tulip_redis.Client(**redis_server)
        self.client.connect()
        yield from self.client.subscribe("main")
        print("init finished")
        def handle_message(msg):
            if msg.kind == 'message':
                self.handler.write_message(msg.body)
                print(msg.body)
            elif msg.kind == 'disconnect':
                pass
        tulip.tasks.async(self.client.listen(handle_message))
        print("listen start")

    def disconnect(self):
        raise Exception("test")
        yield from self.client.disconnect()
        print("disconnected")
        
class ChatHandler(tornado.websocket.WebSocketHandler):
    
    @tulip.task
    def open(self):
        #try:
            self.write_message("hello")
            self.member=Member(self);
            yield from self.member.start_listen()
        #except Exception:
            #traceback.print_exc()

    @tulip.task    
    def on_message(self, message):
        try:
            self.write_message("echo: %s" % message) 
            yield from rc.publish("main", message)
        except Exception:
            traceback.print_exc()

    @tulip.task
    def on_close(self):
        #try:
            yield from self.member.disconnect()
            print("closed")
        #except:
            #traceback.print_exc()
        
application = tornado.web.Application([
    (r"/chat/", ChatHandler),
])

if __name__ == "__main__":
    application.listen(8888)
    IOLoop.instance().start()