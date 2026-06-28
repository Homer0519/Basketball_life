import os,secrets,json
from datetime import timedelta
from pathlib import Path
from quart import Quart, jsonify, request, render_template, make_response
from quart_cors import cors
from .game import get_engine
def create_app(d):
    app=Quart(__name__,static_folder=os.path.join(d,"static"),static_url_path="/static",template_folder=os.path.join(d,"templates"))
    f=Path(d)/"data"/".secret_key"
    k=None
    try:
        if f.exists():k=f.read_text("utf-8").strip()
        if k:app.secret_key=k
    except:pass
    if not app.secret_key:
        k=secrets.token_hex(32);app.secret_key=k
        try:f.parent.mkdir(parents=True,exist_ok=True);f.write_text(k,"utf-8")
        except Exception:pass
    app.config.update(PERMANENT_SESSION_LIFETIME=timedelta(days=7),SESSION_COOKIE_HTTPONLY=True,SESSION_COOKIE_SAMESITE="Lax",TEMPLATES_AUTO_RELOAD=True)
    app.jinja_env.auto_reload = True
    cors(app)
    e=get_engine
    @app.route("/")
    async def idx():return await render_template("game.html")
    @app.route("/api/game/start",methods=["POST"])
    async def s():
        d=await request.get_json()or{};sid=d.get("session_id","default")
        try:n=await e().sg(sid,d.get("player_config",{}));e().sv(sid,"auto");return jsonify({"ok":True,"narrative":n,"session_id":sid})
        except Exception as ex:return jsonify({"ok":False,"error":str(ex)}),500
    @app.route("/api/game/action",methods=["POST"])
    async def a():
        d=await request.get_json()or{};sid=d.get("session_id","default");ui=(d.get("input")or"").strip()
        if not ui:return jsonify({"error":"empty"}),400
        if not e().gs(sid):return jsonify({"error":"no game"}),400
        if not e().al(sid):return jsonify({"error":"busy"}),429
        async def st():
            try:
                async for ck in e().da(sid,ui):yield "data: "+json.dumps({"t":"c","d":ck})+"\n\n"
                st_=e().gst(sid);yield "data: "+json.dumps({"t":"s","d":st_})+"\n\n";yield"data: [DONE]\n\n"
            except Exception as ex:yield "data: "+json.dumps({"t":"e","d":str(ex)})+"\n\ndata: [DONE]\n\n"
            finally:e().rl(sid)
        r=await make_response(st(),{"Content-Type":"text/event-stream","Cache-Control":"no-cache","Connection":"keep-alive"});r.timeout=None;return r
    @app.route("/api/game/stop",methods=["POST"])
    async def stp():d=await request.get_json()or{};e().rl(d.get("session_id","default"));return jsonify({"ok":True})
    @app.route("/api/game/regenerate",methods=["POST"])
    async def rg():
        d=await request.get_json()or{};sid=d.get("session_id","default")
        if not e().gs(sid):return jsonify({"error":"no game"}),400
        if not e().al(sid):return jsonify({"error":"busy"}),429
        async def st():
            try:
                async for ck in e().rg(sid):yield "data: "+json.dumps({"t":"c","d":ck})+"\n\n"
                st_=e().gst(sid);yield "data: "+json.dumps({"t":"s","d":st_})+"\n\n";yield"data: [DONE]\n\n"
            except Exception as ex:yield "data: "+json.dumps({"t":"e","d":str(ex)})+"\n\ndata: [DONE]\n\n"
            finally:e().rl(sid)
        r=await make_response(st(),{"Content-Type":"text/event-stream","Cache-Control":"no-cache"});r.timeout=None;return r
    @app.route("/api/game/modify",methods=["POST"])
    async def md():
        d=await request.get_json()or{};sid=d.get("session_id","default");ni=(d.get("input")or"").strip()
        if not ni:return jsonify({"error":"empty"}),400
        if not e().gs(sid):return jsonify({"error":"no game"}),400
        if not e().al(sid):return jsonify({"error":"busy"}),429
        async def st():
            try:
                async for ck in e().ml(sid,ni):yield "data: "+json.dumps({"t":"c","d":ck})+"\n\n"
                st_=e().gst(sid);yield "data: "+json.dumps({"t":"s","d":st_})+"\n\n";yield"data: [DONE]\n\n"
            except Exception as ex:yield "data: "+json.dumps({"t":"e","d":str(ex)})+"\n\ndata: [DONE]\n\n"
            finally:e().rl(sid)
        r=await make_response(st(),{"Content-Type":"text/event-stream","Cache-Control":"no-cache"});r.timeout=None;return r
    @app.route("/api/game/state")
    async def gs():
        s=e().gst(request.args.get("session_id","default"))
        if not s:return jsonify({"ok":False}),404
        return jsonify({"ok":True,"data":s})
    @app.route("/api/game/lorebook")
    async def lb():return jsonify({"ok":True,"data":e().glb(request.args.get("session_id","default"))})
    @app.route("/api/game/save",methods=["POST"])
    async def sv():
        d=await request.get_json()or{};sid=d.get("session_id","default");slot=d.get("slot","auto")
        e().sv(sid,slot);return jsonify({"ok":True})
    @app.route("/api/game/load",methods=["POST"])
    async def ld():
        d=await request.get_json()or{};sid=d.get("session_id","default");slot=d.get("slot","auto")
        gs=e().ld(sid,slot)
        if not gs:return jsonify({"ok":False}),404
        return jsonify({"ok":True,"data":e().gst(sid)})
    @app.route("/api/game/list_saves",methods=["POST"])
    async def ls_saves():
        d=await request.get_json()or{};sid=d.get("session_id","default")
        return jsonify({"ok":True,"data":e().list_saves(sid)})
    @app.route("/api/game/delete_save",methods=["POST"])
    async def ds():
        d=await request.get_json()or{};sid=d.get("session_id","default");slot=d.get("slot","")
        if not slot or slot=="auto":return jsonify({"ok":False,"error":"Cannot delete auto-save"}),400
        ok=e().delete_save(sid,slot)
        return jsonify({"ok":ok})
    @app.route("/api/game/end",methods=["POST"])
    async def ed():d=await request.get_json()or{};e().es(d.get("session_id","default"));return jsonify({"ok":True})
    return app
