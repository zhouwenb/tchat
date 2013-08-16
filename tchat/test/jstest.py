'''
Created on 2013-8-15

@author: zhouwenb
'''

import tornado.web
import tcomp
import handler

TEMPLATE = """
<!DOCTYPE>
<html>
<head>
    <title>WebSocket Test</title>
    <script type="text/javascript" src="http://code.jquery.com/jquery-1.4.2.min.js"></script>
</head>
<body>
    <h1>WebSocket Test</h1>
    <form method='POST' action='./'>
        <textarea name='data' id="data"></textarea>
        <div><input type='submit' value='send'/></div>
    </form>
    <div id="log"></div>
    <script type="text/javascript" charset="utf-8">
        $(document).ready(function(){
            
            if ("WebSocket" in window) {
              var ws = new WebSocket("ws://localhost:8888/chat/");
              ws.onopen = function() {};
              ws.onmessage = function (evt) {
                  var received_msg = evt.data;
                  var html = $("#log").html();
                  html += "<p>"+received_msg+"</p>";
                  $("#log").html(html);
              };
              ws.onclose = function() {};
              
              $('form').submit(function(event){
                var value = $('#data').val();
                ws.send(value);
                return false;
              });
            } else {
              alert("WebSocket not supported");
            }
        });
    </script>
</body>
</html>
"""

class TestHandler(tornado.web.RequestHandler):
    def get(self):
        self.write(TEMPLATE)
 
    def post(self):
        self.get()

application = tornado.web.Application([
    (r"/chat/", handler.ChatHandler),
    (r"/test/", TestHandler),
])

if __name__ == "__main__":
    application.listen(8888)
    tcomp.ioloop().start()