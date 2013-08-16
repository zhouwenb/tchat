from core import force_result
import config
import tornado.websocket
import tredis
import tulip

redis_server = config.redis_server

rc = tredis.Client(**redis_server)
rc.connect()

class Member(object):
    def __init__(self, handler):
        super(Member, self).__init__()
        self.handler = handler
    
    @tulip.coroutine    
    def start_listen(self):
        self.client = tredis.Client(**redis_server)
        self.client.connect()
        yield from self.client.subscribe("main")
        print("init finished")
        def handle_message(msg):
            if msg.kind == 'message':
                self.handler.write_message(msg.body)
                print(msg.body)
            elif msg.kind == 'disconnect':
                pass
        self.client.listen(handle_message)
        print("listen start")

    @tulip.coroutine 
    def disconnect(self):
        yield from self.client.disconnect()
        print("disconnected")
        
class ChatHandler(tornado.websocket.WebSocketHandler):
    
    @force_result
    @tulip.task
    def open(self):
        self.write_message("hello")
        self.member = Member(self);
        yield from self.member.start_listen()

    @force_result
    @tulip.task    
    def on_message(self, message):
        self.write_message("echo: %s" % message) 
        yield from rc.publish("main", message)

    @force_result
    @tulip.task
    def on_close(self):
        yield from self.member.disconnect()
        print("closed")

