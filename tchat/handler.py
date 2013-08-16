import tcomp
import config
import tornado.websocket
import tulip
import uuid

redis_server = config.redis_server

rc = tcomp.redis.Client(**redis_server)
rc.connect()

class Member(object):
    def __init__(self, handler, uid):
        super(Member, self).__init__()
        self.handler = handler
        self.uid = uid
    
    @tulip.coroutine    
    def start_listen(self):
        self.client = tcomp.redis.Client(**redis_server)
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
    
    @tcomp.force_result
    @tulip.task
    def open(self):
        self.write_message("hello")
        uid=uuid.uuid4().hex
        self.member = Member(self,uid);
        yield from self.member.start_listen()

    @tcomp.force_result
    @tulip.task    
    def on_message(self, message):
        yield from rc.publish("main", "%s says: %s" % (self.member.uid, message))

    @tcomp.force_result
    @tulip.task
    def on_close(self):
        yield from self.member.disconnect()
        print("closed")

