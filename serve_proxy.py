import http.server,urllib.request,urllib.parse,os,json,glob

PORT=8848
DIR=os.path.dirname(os.path.abspath(__file__))
WWW=os.path.join(DIR,'www')
DATA=os.path.join(DIR,'data')
CONFIG=os.path.join(DATA,'config.json')
os.makedirs(DATA,exist_ok=True)

def _json_resp(h,data,code=200):
    h.send_response(code)
    h.send_header('Content-Type','application/json')
    h.send_header('Access-Control-Allow-Origin','*')
    h.end_headers()
    h.wfile.write(json.dumps(data,ensure_ascii=False).encode('utf-8'))

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):
        super().__init__(*a,directory=WWW,**kw)

    def do_GET(self):
        p=urllib.parse.urlparse(self.path)
        qs=urllib.parse.parse_qs(p.query)
        if self.path.startswith('/api/config'):
            if os.path.exists(CONFIG):
                with open(CONFIG,'r',encoding='utf-8') as fh:_json_resp(self,json.load(fh))
            else:_json_resp(self,{})
            return
        if self.path.startswith('/api/saves'):
            fs=[];g=os.path.join(DATA,'save_*.json')
            for f in glob.glob(g):
                fn=os.path.basename(f)
                s=fn.replace('save_','').replace('.json','')
                fs.append(s)
            _json_resp(self,fs);return
        if self.path.startswith('/api/load'):
            s=qs.get('slot',['auto'])[0]
            f=os.path.join(DATA,f'save_{s}.json')
            if os.path.exists(f):
                with open(f,'r',encoding='utf-8') as fh:
                    _json_resp(self,{'ok':True,'data':json.load(fh)})
            else:_json_resp(self,{'ok':False,'error':'not found'},404)
            return
        if self.path.startswith('/api/proxy?'):
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
        p=urllib.parse.urlparse(self.path)
        qs=urllib.parse.parse_qs(p.query)
        if self.path.startswith('/api/config'):
            with open(CONFIG,'wb') as fh:fh.write(self.get_body())
            _json_resp(self,{'ok':True});return
        if self.path.startswith('/api/save'):
            s=qs.get('slot',['auto'])[0];body=self.get_body()
            f=os.path.join(DATA,f'save_{s}.json')
            with open(f,'wb') as fh:fh.write(body)
            _json_resp(self,{'ok':True});return
        if self.path.startswith('/api/proxy?'):
            self.do_GET();return
        if self.path.startswith('/api/proxy_stream?'):
            self.do_GET();return
        super().do_POST()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin','*')
        self.send_header('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS')
        self.send_header('Access-Control-Allow-Headers','Authorization,Content-Type')
        self.end_headers()

    def do_DELETE(self):
        p=urllib.parse.urlparse(self.path)
        qs=urllib.parse.parse_qs(p.query)
        if self.path.startswith('/api/save'):
            s=qs.get('slot',['auto'])[0]
            f=os.path.join(DATA,f'save_{s}.json')
            if os.path.exists(f):os.remove(f)
            _json_resp(self,{'ok':True});return
        self.send_error(405)

    def get_body(self):
        l=int(self.headers.get('Content-Length',0))
        return self.rfile.read(l) if l else b''

http.server.HTTPServer(('127.0.0.1',PORT),H).serve_forever()
