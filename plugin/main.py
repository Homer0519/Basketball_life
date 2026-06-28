"""astrbot_plugin_basketball_web"""
import asyncio, socket, threading, time, json as _json
from pathlib import Path
from astrbot.api.star import Star, Context
from astrbot.api.event import filter, AstrMessageEvent
from astrbot.api import logger
PLUGIN_DIR=Path(__file__).parent
OLD_DATA=Path("/root/data/plugin_data/astrbot_plugin_basketball_web")
DATA_DIR=OLD_DATA if OLD_DATA.exists() else PLUGIN_DIR/"data"
DATA_DIR.mkdir(parents=True,exist_ok=True)

def _load_config():
    for cf in[Path("/root/data/config/astrbot_plugin_basketball_web_config.json"),PLUGIN_DIR/"config.json"]:
        if cf.exists():
            try:return _json.loads(cf.read_text("utf-8-sig"))
            except:pass
    return {}
_current_plugin = None
class BasketballWebPlugin(Star):
    def __init__(self,context,cfg=None):
        super().__init__(context);self.cfg=_load_config()
        if cfg:
            for k,v in cfg.items():
                if k not in self.cfg or not self.cfg[k]:self.cfg[k]=v
        self.p=int(self.cfg.get("port",8848));self._t=None;self._se=threading.Event();self._re=threading.Event()
        key=str(self.cfg.get("llm_api_key",""));model=str(self.cfg.get("llm_model","deepseek-v4-flash"));base=str(self.cfg.get("llm_api_base","https://api.deepseek.com/v1"))
        self.lc={"llm_api_base":base,"llm_api_key":key,"llm_model":model,"llm_max_tokens":int(self.cfg.get("llm_max_tokens",4096))}
        logger.info("[BKW] port=%s model=%s key=%s",self.p,model,"SET" if key else "EMPTY")
        global _current_plugin;_current_plugin=self
        from .web.game import BE, set_engine;self.e=BE(str(DATA_DIR),self.lc);set_engine(self.e)
        self._start()
    @filter.command_group("bblweb")
    def g(self):pass
    @filter.permission_type(filter.PermissionType.ADMIN)
    @g.command("start")
    async def cs(self,ev):
        if self._re.is_set():yield ev.plain_result("OK :%s"%self.p);return
        self._start()
        for _ in range(30):
            if self._re.is_set():yield ev.plain_result("OK :%s"%self.p);return
            await asyncio.sleep(0.2)
        yield ev.plain_result("timeout")
    @filter.permission_type(filter.PermissionType.ADMIN)
    @g.command("stop")
    async def cp(self,ev):await self._stop();yield ev.plain_result("stopped")
    @filter.permission_type(filter.PermissionType.ADMIN)
    @g.command("status")
    async def ct(self,ev):
        yield ev.plain_result("%s port=%s"%("ON" if self._re.is_set() else "OFF",self.p))
    def _start(self):
        if self._re.is_set():return
        from .web.server import create_app;app=create_app(str(PLUGIN_DIR))
        self._se.clear();self._re.clear();se=self._se;re=self._re;pt=self.p
        def _r():
            from hypercorn.config import Config as HC;import hypercorn.asyncio as ha
            loop=asyncio.new_event_loop();asyncio.set_event_loop(loop)
            async def sp(): 
                while not se.is_set():await asyncio.sleep(0.1)
            hc=HC();hc.bind=[f"0.0.0.0:{pt}"];hc.accesslog=None;hc.errorlog=None;hc.loglevel="WARNING";hc.graceful_timeout=5
            try:loop.call_later(0.5,re.set);loop.run_until_complete(ha.serve(app,hc,shutdown_trigger=sp))
            except:pass
            finally:re.clear();loop.close()
        self._t=threading.Thread(target=_r,daemon=True,name="Bkw");self._t.start()
        
        logger.info("[BKW] start 0.0.0.0:%s",self.p)
    async def _stop(self):
        if self._t and self._t.is_alive():self._se.set()
        try:await asyncio.wait_for(asyncio.get_event_loop().run_in_executor(None,self._t.join,5),timeout=8)
        except:pass;self._t=None
        
    async def terminate(self):await self._stop()
def create_plugin():return BasketballWebPlugin