import http.server,urllib.request,urllib.parse,os

PORT=8848
WWW=os.path.join(os.path.dirname(__file__),'www')

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):
        super().__init__(*a,directory=WWW,**kw)

    def do_GET(self):
        if self.path.startswith('/api/proxy?'):
            qs=urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            t=qs.get('target',[None])[0]
            if not t:self.send_error(400);return
            try:
                r=urllib.request.urlopen(urllib.request.Request(t,headers={'Authorization':self.headers.get('Authorization','')}))
                self.send_response(r.status)
                self.send_header('Content-Type',r.headers.get('Content-Type','application/json'))
                self.send_header('Access-Control-Allow-Origin','*')
                self.end_headers()
                while True:
                    b=r.read(8192)
                    if not b:break
                    self.wfile.write(b)
            except Exception as e:self.send_error(500,str(e))
            return
        if self.path.startswith('/api/proxy_stream?'):
            qs=urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            t=qs.get('target',[None])[0]
            if not t:self.send_error(400);return
            self.send_response(200)
            self.send_header('Content-Type','text/event-stream')
            self.send_header('Access-Control-Allow-Origin','*')
            self.end_headers()
            try:
                req=urllib.request.Request(t,data=self.get_body(),headers={'Authorization':self.headers.get('Authorization',''),'Content-Type':'application/json'},method='POST')
                r=urllib.request.urlopen(req)
                while True:
                    b=r.read(8192)
                    if not b:break
                    self.wfile.write(b)
                    self.wfile.flush()
            except Exception as e:pass
            return
        super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/proxy?'):
            self.do_GET()
            return
        if self.path.startswith('/api/proxy_stream?'):
            self.do_GET()
            return
        super().do_POST()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin','*')
        self.send_header('Access-Control-Allow-Methods','GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers','Authorization,Content-Type')
        self.end_headers()

    def get_body(self):
        l=int(self.headers.get('Content-Length',0))
        return self.rfile.read(l) if l else b''

http.server.HTTPServer(('127.0.0.1',PORT),H).serve_forever()
