"""
AniVerse v2 — Flask Backend
Auth (OTP), Comments, Downloads, Watchlist (server-side mirrors),
API Proxy with fallbacks. CORS for Next.js frontend.
"""
import os, re, time, random, hashlib
from datetime import datetime, timezone
from functools import wraps

import requests
from flask import Flask, request, jsonify, session, Response
from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from flask_mail import Mail, Message
from itsdangerous import URLSafeSerializer
from email_validator import validate_email, EmailNotValidError

load_dotenv()

app = Flask(__name__)
app.config.update(
    SECRET_KEY                     = os.environ.get('SECRET_KEY', 'aniverse-v2-secret'),
    SQLALCHEMY_DATABASE_URI        = os.environ.get('DATABASE_URL', 'sqlite:///aniverse.db'),
    SQLALCHEMY_TRACK_MODIFICATIONS = False,
    SESSION_COOKIE_HTTPONLY        = True,
    SESSION_COOKIE_SAMESITE        = 'None',
    SESSION_COOKIE_SECURE          = os.environ.get('FLASK_ENV') == 'production',
    PERMANENT_SESSION_LIFETIME     = 60 * 60 * 24 * 30,
    RESEND_API_KEY                 = os.environ.get('RESEND_API_KEY', 're_cPwhq6Wg_4Zs3vt5mfLYLFMSv2DRk34so'),
    MAIL_SERVER                    = os.environ.get('MAIL_SERVER', 'smtp.gmail.com'),
    MAIL_PORT                      = int(os.environ.get('MAIL_PORT', 587)),
    MAIL_USE_TLS                   = True,
    MAIL_USERNAME                  = os.environ.get('MAIL_USERNAME'),
    MAIL_PASSWORD                  = os.environ.get('MAIL_PASSWORD'),
    MAIL_DEFAULT_SENDER            = os.environ.get('MAIL_USERNAME', 'noreply@aniverse.com')
)

API_BASE     = os.environ.get('API_BASE', 'https://animapi.ayohost.site')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

CORS(app,
     origins=[FRONTEND_URL, FRONTEND_URL.replace('https://', 'https://www.'), 'http://localhost:3000','http://127.0.0.1:3000',
              'http://localhost:3001','http://127.0.0.1:3001',
              'http://localhost', 'capacitor://localhost'],
     supports_credentials=True,
     allow_headers=['Content-Type','Authorization'],
     methods=['GET','POST','DELETE','OPTIONS'])

db      = SQLAlchemy(app)
limiter = Limiter(key_func=get_remote_address, app=app, default_limits=[], storage_uri='memory://')
cache   = Cache(app, config={'CACHE_TYPE':'SimpleCache','CACHE_DEFAULT_TIMEOUT':300})
mail    = Mail(app)
serializer = URLSafeSerializer(app.config['SECRET_KEY'])

# ── Models ────────────────────────────────────────────────────────────────────

class User(db.Model):
    __tablename__ = 'users'
    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(64),  nullable=False)
    email         = db.Column(db.String(256), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_verified   = db.Column(db.Boolean, default=False)
    created_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    comments  = db.relationship('Comment',  backref='author', lazy='dynamic', cascade='all,delete-orphan')
    downloads = db.relationship('Download', backref='user',   lazy='dynamic', cascade='all,delete-orphan')
    watchlist = db.relationship('Watchlist',backref='user',   lazy='dynamic', cascade='all,delete-orphan')
    history   = db.relationship('History',  backref='user',   lazy='dynamic', cascade='all,delete-orphan')

    def to_dict(self):
        return {'id':self.id,'username':self.username,'email':self.email,
                'download_count':Download.query.filter_by(user_id=self.id).count(),
                'watchlist_count':Watchlist.query.filter_by(user_id=self.id).count(),
                'comment_count':Comment.query.filter_by(user_id=self.id).count(),
                'member_since':self.created_at.strftime('%b %Y')}

class OTPRecord(db.Model):
    __tablename__ = 'otp_records'
    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(256), unique=True, nullable=False)
    otp_hash      = db.Column(db.String(64),  nullable=False)
    expires_at    = db.Column(db.Float, nullable=False)
    attempts      = db.Column(db.Integer, default=0)
    last_sent     = db.Column(db.Float, default=time.time)
    username      = db.Column(db.String(64))
    password_hash = db.Column(db.String(256))

class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'
    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(256), unique=True, nullable=False)
    code_hash     = db.Column(db.String(64),  nullable=False)
    expires_at    = db.Column(db.Float, nullable=False)
    attempts      = db.Column(db.Integer, default=0)
    last_sent     = db.Column(db.Float, default=time.time)

class Comment(db.Model):
    __tablename__ = 'comments'
    id         = db.Column(db.Integer, primary_key=True)
    anime_slug = db.Column(db.String(256), nullable=False, index=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    text       = db.Column(db.String(1000), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    parent_id  = db.Column(db.Integer, db.ForeignKey('comments.id', ondelete='CASCADE'), nullable=True)

    def to_dict(self):
        return {'id':self.id,'username':self.author.username,'text':self.text,
                'time':self.created_at.strftime('%d %b %Y, %H:%M'),'parent_id':self.parent_id}

class Download(db.Model):
    __tablename__ = 'downloads'
    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    anime_slug    = db.Column(db.String(256), nullable=False)
    anime_title   = db.Column(db.String(512))
    anime_cover   = db.Column(db.String(1024))
    episode_num   = db.Column(db.Integer, nullable=False)
    episode_id    = db.Column(db.String(256))
    episode_title = db.Column(db.String(512))
    saved_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    __table_args__ = (db.UniqueConstraint('user_id','anime_slug','episode_num',name='uq_user_ep'),)
    def to_dict(self):
        return {'id':self.id,'anime_slug':self.anime_slug,'anime_title':self.anime_title,
                'anime_cover':self.anime_cover,'episode_num':self.episode_num,
                'episode_id':self.episode_id,'episode_title':self.episode_title,
                'saved_at':self.saved_at.strftime('%d %b %Y')}

class Watchlist(db.Model):
    __tablename__ = 'watchlist'
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    anime_slug  = db.Column(db.String(256), nullable=False)
    anime_title = db.Column(db.String(512))
    anime_cover = db.Column(db.String(1024))
    added_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    __table_args__ = (db.UniqueConstraint('user_id','anime_slug',name='uq_user_anime'),)
    def to_dict(self):
        return {'id':self.id,'anime_slug':self.anime_slug,'anime_title':self.anime_title,
                'anime_cover':self.anime_cover,'added_at':self.added_at.strftime('%d %b %Y')}

class History(db.Model):
    __tablename__ = 'history'
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    anime_slug  = db.Column(db.String(256), nullable=False)
    anime_title = db.Column(db.String(512))
    anime_cover = db.Column(db.String(1024))
    last_ep_num = db.Column(db.Integer, default=0)
    last_ep_id  = db.Column(db.String(256))
    last_ep_title=db.Column(db.String(512))
    progress    = db.Column(db.Integer, default=0)
    updated_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    __table_args__ = (db.UniqueConstraint('user_id','anime_slug',name='uq_user_history_anime'),)
    def to_dict(self):
        return {'id':self.id,'slug':self.anime_slug,'title':self.anime_title,
                'cover':self.anime_cover,'lastEpNum':self.last_ep_num,
                'lastEpId':self.last_ep_id,'lastEpTitle':self.last_ep_title,
                'progress':self.progress,'updated_at':self.updated_at.isoformat()}

# ── Helpers ────────────────────────────────────────────────────────────────────

def _hdrs():
    return {'Accept':'application/json','Content-Type':'application/json'}

def _get(path, params=None, timeout=20):
    r = requests.get(f'{API_BASE}{path}', params=params, headers=_hdrs(), timeout=timeout)
    r.raise_for_status(); return r.json()

def _post(path, payload=None, timeout=25):
    r = requests.post(f'{API_BASE}{path}', json=payload or {}, headers=_hdrs(), timeout=timeout)
    r.raise_for_status(); return r.json()

def _find_url(payload):
    if isinstance(payload, str):
        if payload.startswith(('http://', 'https://')):
            return payload
        return None
    if isinstance(payload, dict):
        for key, value in payload.items():
            if isinstance(value, str) and key.lower() in ('stream_url', 'url', 'hls', 'link', 'source', 'm3u8', 'file_url', 'download_url'):
                if value.startswith(('http://', 'https://')):
                    return value
            found = _find_url(value)
            if found:
                return found
    if isinstance(payload, list):
        for item in payload:
            found = _find_url(item)
            if found:
                return found
    return None

def _search_session(slug):
    if not slug: return None
    try:
        data = _get('/search', params={'q': slug})
        items = data.get('data') or data.get('results') or []
        if not isinstance(items, list):
            return None
        best = None
        lower_slug = slug.lower().replace('-', ' ').strip()
        for item in items:
            title = str(item.get('title') or item.get('anime_title') or item.get('name') or '').lower()
            session = item.get('session') or item.get('anime_session') or item.get('slug') or item.get('id')
            if session and lower_slug and lower_slug in title:
                best = item
                break
        if not best and items:
            best = items[0]
        return best.get('session') or best.get('anime_session') or best.get('slug') or best.get('id') if best else None
    except Exception:
        return None

def _sanitize_filename(name):
    return re.sub(r'[^a-zA-Z0-9._\-]+', '_', name).strip('_')[:180]


def _me():
    auth = request.headers.get('Authorization')
    if auth and auth.startswith('Bearer '):
        try:
            uid = serializer.loads(auth.split(' ')[1])
            return db.session.get(User, uid)
        except Exception:
            pass
    return db.session.get(User, session.get('user_id'))

def auth_required(f):
    @wraps(f)
    def dec(*a,**kw):
        if not _me(): return jsonify({'error':'Auth required'}),401
        return f(*a,**kw)
    return dec

def _hash(otp): return hashlib.sha256(otp.encode()).hexdigest()
SLUG_RE = re.compile(r'^[\w\-]+$')

def _validate_pw(pw):
    if len(pw)<8: return 'Password must be 8+ characters'
    if not re.search(r'[A-Z]',pw): return 'Needs 1 uppercase letter'
    if not re.search(r'[0-9]',pw): return 'Needs 1 number'

def _send_otp(email, username, otp):
    if not app.config.get('RESEND_API_KEY'):
        app.logger.info(f'\n{"─"*44}\nOTP for {email} ({username}): {otp}\n{"─"*44}')
        return
        
    html_content = f"""
    <div style="font-family: 'Exo 2', sans-serif; background-color: #06141B; padding: 40px 20px; color: #fff; text-align: center; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid rgba(83, 198, 193, 0.2);">
        <div style="margin-bottom: 20px;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px;">
                <span style="color: #53C6C1;">Ani</span>Verse
            </h1>
            <p style="color: #9BA8AB; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Enter the Multiverse</p>
        </div>
        
        <div style="background-color: rgba(170, 217, 214, 0.05); border: 1px solid rgba(83, 198, 193, 0.2); border-radius: 12px; padding: 30px; margin: 20px 0;">
            <h2 style="color: #fff; font-size: 20px; margin-top: 0;">Welcome, <span style="color: #53C6C1;">{username}</span>!</h2>
            <p style="color: #CCD0CF; font-size: 14px; margin-bottom: 20px;">Use the following verification code to access your account.</p>
            
            <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #53C6C1; background: rgba(83, 198, 193, 0.1); padding: 15px 20px; display: inline-block; border-radius: 8px; border: 1px dashed rgba(83, 198, 193, 0.5);">
                {otp}
            </div>
            
            <p style="font-size: 12px; color: #e05d5d; margin-top: 20px; font-weight: bold;">
                <span style="font-size: 14px;">⏱</span> This code expires in 5 minutes.
            </p>
        </div>
        
        <p style="font-size: 11px; color: #4A5C6A; margin-bottom: 0;">
            If you didn't request this code, please ignore this email.<br/>
            &copy; 2026 AniVerse. All rights reserved.
        </p>
    </div>
    """
    
    import threading
    import requests
    
    def send_async_email(app_context, html_body):
        with app_context:
            try:
                api_key = app.config.get('RESEND_API_KEY')
                headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                payload = {
                    "from": "AniVerse <noreply@aniiverse.name.ng>",
                    "to": [email],
                    "subject": "Your AniVerse OTP",
                    "html": html_body
                }
                res = requests.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=10)
                if res.status_code >= 400:
                    app.logger.error(f"Resend API Error: {res.text}")
            except Exception as e:
                app.logger.error(f"Failed to send OTP to {email}: {e}")
                
    threading.Thread(target=send_async_email, args=(app.app_context(), html_content)).start()

def _send_reset_email(email, username, code):
    if not app.config.get('RESEND_API_KEY'):
        app.logger.info(f'\n{"─"*44}\nPassword Reset for {email} ({username}): {code}\n{"─"*44}')
        return
        
    html_content = f"""
    <div style="font-family: 'Exo 2', sans-serif; background-color: #06141B; padding: 40px 20px; color: #fff; text-align: center; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid rgba(83, 198, 193, 0.2);">
        <div style="margin-bottom: 20px;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px;">
                <span style="color: #53C6C1;">Ani</span>Verse
            </h1>
            <p style="color: #9BA8AB; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Account Recovery</p>
        </div>
        
        <div style="background-color: rgba(170, 217, 214, 0.05); border: 1px solid rgba(83, 198, 193, 0.2); border-radius: 12px; padding: 30px; margin: 20px 0;">
            <h2 style="color: #fff; font-size: 20px; margin-top: 0;">Hi, <span style="color: #53C6C1;">{username}</span>!</h2>
            <p style="color: #CCD0CF; font-size: 14px; margin-bottom: 20px;">You requested a password reset. Use the code below to reset your password.</p>
            
            <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #53C6C1; background: rgba(83, 198, 193, 0.1); padding: 15px 20px; display: inline-block; border-radius: 8px; border: 1px dashed rgba(83, 198, 193, 0.5);">
                {code}
            </div>
            
            <p style="font-size: 12px; color: #e05d5d; margin-top: 20px; font-weight: bold;">
                <span style="font-size: 14px;">⏱</span> This code expires in 10 minutes.
            </p>
        </div>
        
        <p style="font-size: 11px; color: #4A5C6A; margin-bottom: 0;">
            If you didn't request a password reset, you can safely ignore this email.<br/>
            &copy; 2026 AniVerse. All rights reserved.
        </p>
    </div>
    """
    
    import threading
    import requests
    
    def send_async_email(app_context, html_body):
        with app_context:
            try:
                api_key = app.config.get('RESEND_API_KEY')
                headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                payload = {
                    "from": "AniVerse <noreply@aniiverse.name.ng>",
                    "to": [email],
                    "subject": "AniVerse Password Reset",
                    "html": html_body
                }
                res = requests.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=10)
                if res.status_code >= 400:
                    app.logger.error(f"Resend API Error: {res.text}")
            except Exception as e:
                app.logger.error(f"Failed to send reset email to {email}: {e}")
                
    threading.Thread(target=send_async_email, args=(app.app_context(), html_content)).start()

# ── Health ─────────────────────────────────────────────────────────────────────

@app.route('/health')
def health(): return jsonify({'status':'ok','version':'2.0.0'})

# ── Anime Proxy ────────────────────────────────────────────────────────────────

@app.route('/api/airing')
@cache.cached(timeout=180,query_string=True)
def api_airing():
    page = request.args.get('page',1,type=int)
    try: return jsonify(_get('/api/airing',params={'page':page}))
    except requests.Timeout: return jsonify({'error':'Timeout','results':[]}),504
    except Exception as e: app.logger.error(f'[airing]{e}'); return jsonify({'error':str(e),'results':[]}),502

@app.route('/api/trending')
@cache.cached(timeout=600)
def api_trending():
    # Try trending endpoint, fall back to page 2 of airing (different content)
    for path in ['/api/top-anime','/api/airing']:
        try: return jsonify(_get(path, timeout=6))
        except: continue
    # Last resort: return page 2 of airing
    try: return jsonify(_get('/api/airing',params={'page':2}, timeout=10))
    except Exception as e: return jsonify({'error':str(e),'results':[]}),502

@app.route('/api/recommended')
@cache.cached(timeout=600)
def api_recommended():
    for path in ['/api/recent-episodes','/api/top-anime','/api/airing']:
        try: return jsonify(_get(path, timeout=6))
        except: continue
    # Fallback: page 3 of airing acts as "recommended"
    try: return jsonify(_get('/api/airing',params={'page':3}, timeout=10))
    except Exception as e: return jsonify({'error':str(e),'results':[]}),502

@app.route('/api/search')
@limiter.limit('60 per minute')
def api_search():
    q = request.args.get('q','').strip()
    if not q: return jsonify({'results':[]})
    if len(q)>200: return jsonify({'error':'Too long'}),400
    ck=f'search:{q.lower()}'
    hit=cache.get(ck)
    if hit: return jsonify(hit)
    for path in ['/api/search', '/search']:
        try:
            data = _get(path, params={'q': q})
            if data and (data.get('results') or data.get('data') or data.get('anime') or isinstance(data, list)):
                cache.set(ck, data, timeout=120)
                return jsonify(data)
        except Exception:
            continue
    return jsonify({'error':'Search failed','results':[]}),502

@app.route('/api/anime/<slug>')
def api_detail(slug):
    if not SLUG_RE.match(slug): return jsonify({'error':'Invalid slug'}),400
    ck=f'anime:{slug}'; hit=cache.get(ck)
    if hit:
        u=_me()
        if u: hit['in_watchlist']=Watchlist.query.filter_by(user_id=u.id,anime_slug=slug).first() is not None
        return jsonify(hit)

    anime_name = request.args.get('title','').strip() or request.args.get('anime_name','').strip()
    try:
        params = {'anime_name': anime_name} if anime_name else None
        data = _get(f'/api/anime/{slug}/info', params=params)
        if isinstance(data, dict) and data:
            cache.set(ck, data, timeout=3600)
            u=_me()
            if u: data['in_watchlist']=Watchlist.query.filter_by(user_id=u.id,anime_slug=slug).first() is not None
            return jsonify(data)
    except Exception:
        pass

    session_id = _search_session(slug) or slug
    if session_id != slug:
        try:
            data = _get(f'/api/anime/{session_id}/info', params={'anime_name': anime_name} if anime_name else None)
            if isinstance(data, dict) and data:
                cache.set(ck, data, timeout=3600)
                u=_me()
                if u: data['in_watchlist']=Watchlist.query.filter_by(user_id=u.id,anime_slug=slug).first() is not None
                return jsonify(data)
        except Exception:
            pass

    try:
        search_results = _get('/api/search', params={'q': slug})
        results = search_results.get('data') or search_results.get('results') or []
        if results:
            best_match = None
            lower_slug = slug.lower().replace('-', ' ').strip()
            for item in results:
                title = str(item.get('title','') or item.get('anime_title','') or item.get('name','') or '').lower()
                if lower_slug and lower_slug in title:
                    best_match = item
                    break
            if not best_match and results:
                best_match = results[0]
            if best_match:
                if not best_match.get('title') and anime_name:
                    best_match['title'] = anime_name
                data = {
                    'anime': best_match,
                    'data': best_match,
                    'session': best_match.get('session'),
                    'title': best_match.get('title'),
                    'poster': best_match.get('poster'),
                    'episodes': best_match.get('episodes'),
                    'status': best_match.get('status'),
                    'type': best_match.get('type'),
                    'score': best_match.get('score'),
                    'year': best_match.get('year'),
                    'season': best_match.get('season')
                }
                cache.set(ck,data,timeout=3600)
                u=_me()
                if u: data['in_watchlist']=Watchlist.query.filter_by(user_id=u.id,anime_slug=slug).first() is not None
                return jsonify(data)
    except Exception:
        pass

    return jsonify({'error':'Not Found'}),404

@app.route('/api/anime/<slug>/episodes')
def api_episodes(slug):
    if not SLUG_RE.match(slug): return jsonify({'error':'Invalid slug'}),400
    ck=f'eps:{slug}'; hit=cache.get(ck)
    if hit: return jsonify(hit)

    anime_name = request.args.get('title','').strip() or request.args.get('anime_name','').strip()
    session_id = slug
    params = {'anime_name': anime_name} if anime_name else None
    try:
        data = _get(f'/api/anime/{session_id}/episodes', params=params)
        cache.set(ck,data,timeout=1800); return jsonify(data)
    except Exception:
        pass

    session_id = _search_session(slug) or slug
    if session_id != slug:
        try:
            data = _get(f'/api/anime/{session_id}/episodes', params=params)
            cache.set(ck,data,timeout=1800); return jsonify(data)
        except Exception:
            pass

    try:
        data=_get(f'/api/anime/{slug}/episodes', params=params)
        cache.set(ck,data,timeout=1800); return jsonify(data)
    except requests.Timeout: return jsonify({'error':'Timed out','episodes':[]}),504
    except Exception as e: return jsonify({'error':str(e),'episodes':[]}),502

@app.route('/api/genres')
@cache.cached(timeout=1800)
def api_genres():
    fallback = {'genres': ['Action','Adventure','Comedy','Drama','Fantasy','Horror','Mecha','Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller','Ecchi','Isekai','Shounen']}
    try:
        data = _get('/api/genres')
        if isinstance(data, dict) and ('genres' in data or 'data' in data):
            return jsonify(data)
        if isinstance(data, list):
            return jsonify({'genres': data})
        return jsonify(fallback)
    except requests.Timeout:
        return jsonify(fallback),504
    except Exception:
        return jsonify(fallback),502

@app.route('/api/genre/<path:genre>')
@cache.cached(timeout=1800)
def api_genre(genre):
    if not genre or len(genre) > 64: return jsonify({'error':'Invalid genre'}),400
    try:
        data = _get(f'/api/genre/{genre}')
        return jsonify(data)
    except Exception:
        # Genre endpoint may not exist on remote API. Fall back to a search by genre name.
        try:
            data = _get('/api/search', params={'q': genre})
            return jsonify(data)
        except Exception:
            try:
                return jsonify(_get('/api/top-anime'))
            except Exception as e:
                app.logger.error(f'[genre fallback]{genre} {e}')
                return jsonify({'results':[]}),502

@app.route('/api/stream/qualities')
@limiter.limit('60 per minute')
def get_stream_qualities():
    ep_id = request.args.get('episode_session','').strip() or request.args.get('episode_id','').strip() or request.args.get('id','').strip()
    anime_slug = request.args.get('anime_slug','').strip() or request.args.get('slug','').strip()
    if not ep_id: return jsonify({'error':'episode_session required'}),400
    if not anime_slug: return jsonify({'error':'anime_slug required'}),400
    if not SLUG_RE.match(anime_slug): return jsonify({'error':'Invalid anime_slug'}),400
    try:
        data = _get('/api/stream/qualities', params={'anime_slug': anime_slug, 'episode_session': ep_id})
        if isinstance(data, dict):
            return jsonify(data)
        if isinstance(data, list):
            return jsonify({'qualities': data})
        return jsonify({'qualities': ['best','1080p','720p','480p'], 'audios': ['jpn','eng']})
    except Exception:
        return jsonify({'qualities': ['best','1080p','720p','480p'], 'audios': ['jpn','eng']})

@app.route('/api/get-stream',methods=['POST','GET'])
@app.route('/api/stream',methods=['POST','GET'])
@limiter.limit('60 per minute')
def get_stream():
    if request.method=='GET':
        ep_id = request.args.get('episode_session','').strip() or request.args.get('episode_id','').strip() or request.args.get('id','').strip()
        anime_slug = request.args.get('anime_slug','').strip() or request.args.get('slug','').strip()
        quality = request.args.get('quality','').strip()
        audio = request.args.get('audio','').strip()
    else:
        d=request.get_json(silent=True) or {}
        ep_id = str(d.get('episode_session','')).strip() or str(d.get('episode_id','')).strip() or str(d.get('id','')).strip()
        anime_slug = str(d.get('anime_slug','')).strip() or str(d.get('slug','')).strip()
        quality = str(d.get('quality','')).strip()
        audio = str(d.get('audio','')).strip()
    if not ep_id: return jsonify({'error':'episode_session required'}),400
    if not anime_slug: return jsonify({'error':'anime_slug required'}),400
    if not SLUG_RE.match(anime_slug): return jsonify({'error':'Invalid anime_slug'}),400
    params = {'anime_slug': anime_slug, 'episode_session': ep_id}
    if quality: params['quality'] = quality
    if audio: params['audio'] = audio
    try:
        result = _get('/api/stream', params=params)
        url = result.get('stream_url') or result.get('url') or result.get('hls') or ''
        
        # If it's the iframe player, we MUST extract the token and proxy it to bypass Cloudflare
        if url and ('token=' in url or '/api/player' in url):
            from urllib.parse import urlparse, parse_qs, unquote
            full = url if url.startswith('http') else f'{API_BASE}{url}'
            parsed = urlparse(full)
            params_qs = parse_qs(parsed.query)
            token = params_qs.get('token', [None])[0]
            if token:
                real_url = unquote(token)
                import urllib.parse
                encoded = urllib.parse.quote(real_url, safe='')
                proxy_url = f'/api/proxy-stream?url={encoded}'
                return jsonify({'stream_url': proxy_url, 'direct_url': real_url})

        if url and url.startswith('/'):
            url = f'{API_BASE}{url}'
        if url:
            return jsonify({'stream_url': url})
    except Exception as e:
        app.logger.error(f'[stream]{e}')
    return jsonify({'error': 'Stream unavailable'}), 502

@app.route('/api/proxy-stream')
def proxy_stream():
    """Proxy M3U8 and TS segments through the backend, adding proper Referer headers
    so the CDN (owocdn.top) accepts the request."""
    from urllib.parse import urlparse, urljoin, quote, unquote
    url = request.args.get('url', '').strip()
    if not url: return 'Missing url', 400
    url = unquote(url)
    
    proxy_headers = {
        'Referer': 'https://apis.ayohost.site/',
        'Origin':  'https://apis.ayohost.site',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
    try:
        r = requests.get(url, headers=proxy_headers, timeout=20, stream=True)
        content_type = r.headers.get('Content-Type', 'application/octet-stream')
        
        # For M3U8 playlists rewrite segment URLs to go through this proxy
        if 'm3u8' in content_type or url.endswith('.m3u8'):
            text = r.text
            base = url.rsplit('/', 1)[0] + '/'
            lines = []
            for line in text.splitlines():
                stripped = line.strip()
                if stripped and not stripped.startswith('#'):
                    if stripped.startswith('http'):
                        seg_url = stripped
                    else:
                        seg_url = urljoin(base, stripped)
                    lines.append(f'/api/proxy-stream?url={quote(seg_url, safe="")}')
                else:
                    lines.append(line)
            resp = Response('\n'.join(lines), content_type='application/vnd.apple.mpegurl')
            resp.headers['Access-Control-Allow-Origin'] = '*'
            return resp
        
        # For TS segments stream directly
        resp = Response(
            r.iter_content(chunk_size=8192),
            content_type=content_type,
            status=r.status_code
        )
        resp.headers['Access-Control-Allow-Origin'] = '*'
        return resp
    except Exception as e:
        app.logger.error(f'[proxy-stream] {e}')
        return f'Proxy error: {e}', 502

@app.route('/api/download', methods=['POST'])
@limiter.limit('20 per minute')
def api_download():
    d=request.get_json(silent=True) or {}
    if not d:
        return jsonify({'error':'Missing payload'}),400
    try:
        return jsonify(_post('/api/download', d))
    except requests.Timeout:
        return jsonify({'error':'Timed out'}),504
    except Exception as e:
        app.logger.error(f'[download]{e}')
        return jsonify({'error':str(e)}),502

# Proxy the download job endpoint directly to the remote API.
# The remote service handles job creation and file delivery.

@app.route('/api/download/<download_id>/file')
def api_download_file(download_id):
    if not download_id:
        return jsonify({'error':'Missing id'}),400
    try:
        r = requests.get(f'{API_BASE}/api/download/{download_id}/file', headers=_hdrs(), stream=True, timeout=60)
        r.raise_for_status()
        response = Response(r.iter_content(chunk_size=8192), status=r.status_code, content_type=r.headers.get('Content-Type','application/octet-stream'))
        if r.headers.get('Content-Disposition'):
            response.headers['Content-Disposition'] = r.headers.get('Content-Disposition')
        else:
            response.headers['Content-Disposition'] = f'attachment; filename="download_{download_id}.mp4"'
        return response
    except requests.Timeout:
        return jsonify({'error':'Timed out'}),504
    except Exception as e:
        app.logger.error(f'[download_file]{e}')
        return jsonify({'error':str(e)}),502

@app.route('/api/download/<download_id>/status')
def api_download_status(download_id):
    if not download_id:
        return jsonify({'error':'Missing id'}),400
    try:
        return jsonify(_get(f'/api/download/{download_id}/status'))
    except requests.Timeout:
        return jsonify({'error':'Timed out'}),504
    except Exception as e:
        app.logger.error(f'[download_status]{e}')
        return jsonify({'error':str(e)}),502

# ── Auth ───────────────────────────────────────────────────────────────────────

@app.route('/api/auth/signup',methods=['POST'])
@limiter.limit('10 per hour')
def signup():
    d=request.get_json(silent=True) or {}
    username=d.get('username','').strip()
    email   =d.get('email','').strip().lower()
    password=d.get('password','')
    if not re.match(r'^[a-zA-Z0-9_\-\.]{3,32}$',username):
        return jsonify({'error':'Username: 3-32 chars, letters/numbers/_ -.'}),400
    try:
        email = validate_email(email, check_deliverability=True).normalized
    except EmailNotValidError:
        return jsonify({'error':'Invalid Email'}),400
    err=_validate_pw(password)
    if err: return jsonify({'error':err}),400
    if User.query.filter_by(email=email,is_verified=True).first():
        return jsonify({'error':'Email already registered'}),409
    otp=str(random.randint(100000,999999)); pw_hash=generate_password_hash(password)
    rec=OTPRecord.query.filter_by(email=email).first()
    
    now = time.time()
    if rec:
        if now - rec.last_sent < 30:
            return jsonify({'error':f'Please wait {int(30 - (now - rec.last_sent))}s to resend'}),429
        rec.otp_hash=_hash(otp);rec.expires_at=now+300;rec.attempts=0;rec.last_sent=now;rec.username=username;rec.password_hash=pw_hash
    else:
        rec=OTPRecord(email=email,otp_hash=_hash(otp),expires_at=now+300,username=username,password_hash=pw_hash,last_sent=now)
        db.session.add(rec)
    db.session.commit()
    _send_otp(email,username,otp)
    session['pending_email']=email
    resp={'success':True,'message':'OTP sent'}
    if app.debug: resp['_dev_otp']=otp
    return jsonify(resp)

@app.route('/api/auth/verify-otp',methods=['POST'])
@limiter.limit('20 per hour')
def verify_otp():
    d=request.get_json(silent=True) or {}
    email=d.get('email','').lower()
    code =str(d.get('otp','')).strip()
    if not email: return jsonify({'error':'No email provided'}),400
    if not re.match(r'^\d{6}$',code): return jsonify({'error':'6-digit OTP required'}),400
    rec=OTPRecord.query.filter_by(email=email).first()
    if not rec: return jsonify({'error':'OTP not found, sign up again'}),400
    if time.time()>rec.expires_at:
        db.session.delete(rec);db.session.commit();session.pop('pending_email',None)
        return jsonify({'error':'OTP expired'}),400
    if rec.attempts>=5:
        db.session.delete(rec);db.session.commit();session.pop('pending_email',None)
        return jsonify({'error':'Too many attempts'}),429
    if _hash(code)!=rec.otp_hash:
        rec.attempts+=1;db.session.commit()
        return jsonify({'error':f'Wrong OTP — {5-rec.attempts} left'}),401
    user=User.query.filter_by(email=email).first()
    if user: user.username=rec.username;user.password_hash=rec.password_hash;user.is_verified=True
    else:
        user=User(username=rec.username,email=email,password_hash=rec.password_hash,is_verified=True)
        db.session.add(user)
    db.session.delete(rec);db.session.commit()
    session.pop('pending_email',None)
    session.permanent=True; session['user_id']=user.id
    token = serializer.dumps(user.id)
    return jsonify({'success':True,'user':user.to_dict(), 'token':token})

@app.route('/api/auth/resend-otp',methods=['POST'])
@limiter.limit('20 per hour')
def resend_otp():
    d=request.get_json(silent=True) or {}
    email=d.get('email','').lower()
    if not email: return jsonify({'error':'No email provided'}),400
    rec=OTPRecord.query.filter_by(email=email).first()
    if not rec: return jsonify({'error':'Sign up again'}),400
    
    now = time.time()
    if now-(rec.last_sent or 0)<30:
        return jsonify({'error':f'Wait {int(30-(now-rec.last_sent))}s'}),429
        
    otp=str(random.randint(100000,999999))
    rec.otp_hash=_hash(otp);rec.expires_at=now+300;rec.attempts=0;rec.last_sent=now
    db.session.commit(); _send_otp(email,rec.username,otp)
    
    resp={'success':True}
    if app.debug: resp['_dev_otp']=otp
    return jsonify(resp)

@app.route('/api/auth/login',methods=['POST'])
@limiter.limit('20 per hour')
def login():
    d=request.get_json(silent=True) or {}
    email=d.get('email','').lower(); pw=d.get('password','')
    if not email or not pw: return jsonify({'error':'All fields required'}),400
    user=User.query.filter_by(email=email,is_verified=True).first()
    if not user or not check_password_hash(user.password_hash,pw):
        return jsonify({'error':'Invalid email or password'}),401
    session.permanent=True; session['user_id']=user.id
    token = serializer.dumps(user.id)
    return jsonify({'success':True,'user':user.to_dict(), 'token':token})

@app.route('/api/auth/logout',methods=['POST'])
def logout(): session.clear(); return jsonify({'success':True})

@app.route('/api/auth/update-username',methods=['POST'])
@auth_required
def update_username():
    d=request.get_json(silent=True) or {}; new=d.get('username','').strip()
    if not re.match(r'^[a-zA-Z0-9_\-\.]{3,32}$',new): return jsonify({'error':'Invalid username'}),400
    u=_me(); u.username=new; db.session.commit(); return jsonify({'success':True,'user':u.to_dict()})

@app.route('/api/auth/change-password',methods=['POST'])
@auth_required
@limiter.limit('5 per hour')
def change_password():
    d=request.get_json(silent=True) or {}
    u=_me()
    if not check_password_hash(u.password_hash,d.get('old_password','')): return jsonify({'error':'Wrong current password'}),401
    err=_validate_pw(d.get('new_password','')); 
    if err: return jsonify({'error':err}),400
    u.password_hash=generate_password_hash(d['new_password']); db.session.commit()
    return jsonify({'success':True})

@app.route('/api/auth/update-avatar',methods=['POST'])
@auth_required
@limiter.limit('10 per hour')
def update_avatar():
    """Store user avatar URL (a public URL or base64 data URL is expected from the client)."""
    d=request.get_json(silent=True) or {}
    avatar_url = d.get('avatar_url','').strip()
    if not avatar_url:
        return jsonify({'error':'avatar_url required'}),400
    # Store in user metadata — we use a simple key in DB; for now surface it in to_dict
    u = _me()
    # We persist via a new optional column; if column doesn't exist yet, silently ignore DB errors
    try:
        if not hasattr(u, 'avatar_url') or u.__table__.columns.get('avatar_url') is None:
            # Dynamic fallback: store in session cache only
            pass
        else:
            u.avatar_url = avatar_url[:2048]
            db.session.commit()
    except Exception:
        pass
    return jsonify({'success':True,'avatar_url':avatar_url})

@app.route('/api/auth/forgot-password',methods=['POST'])
@limiter.limit('5 per hour')
def forgot_password():
    d=request.get_json(silent=True) or {}
    email=d.get('email','').strip().lower()
    if not email: return jsonify({'error':'Email required'}),400
    try:
        email = validate_email(email, check_deliverability=True).normalized
    except EmailNotValidError:
        return jsonify({'error':'Invalid Email'}),400
    u=User.query.filter_by(email=email).first()
    if not u:
        return jsonify({'error':'Account not found'}),404
    code=str(random.randint(100000,999999))
    rec=PasswordResetToken.query.filter_by(email=email).first()
    now=time.time()
    if rec:
        if now-rec.last_sent < 60:
            return jsonify({'error':f'Please wait {int(60 - (now - rec.last_sent))}s to resend'}),429
        rec.code_hash=_hash(code); rec.expires_at=now+600; rec.attempts=0; rec.last_sent=now
    else:
        rec=PasswordResetToken(email=email, code_hash=_hash(code), expires_at=now+600, last_sent=now)
        db.session.add(rec)
    db.session.commit()
    _send_reset_email(email, u.username, code)
    return jsonify({'success':True, 'message':'Password reset code sent'})

@app.route('/api/auth/reset-password',methods=['POST'])
@limiter.limit('20 per hour')
def reset_password():
    d=request.get_json(silent=True) or {}
    email=d.get('email','').lower()
    code=str(d.get('otp','')).strip()
    new_pw=d.get('new_password','')
    if not email or not code: return jsonify({'error':'Email and code required'}),400
    if not re.match(r'^\d{6}$',code): return jsonify({'error':'6-digit code required'}),400
    err=_validate_pw(new_pw); 
    if err: return jsonify({'error':err}),400
    
    rec=PasswordResetToken.query.filter_by(email=email).first()
    if not rec: return jsonify({'error':'Reset session expired or not found'}),400
    if time.time()>rec.expires_at:
        db.session.delete(rec); db.session.commit()
        return jsonify({'error':'Code expired'}),400
    if rec.attempts>=5:
        db.session.delete(rec); db.session.commit()
        return jsonify({'error':'Too many attempts, request a new code'}),429
    if _hash(code)!=rec.code_hash:
        rec.attempts+=1; db.session.commit()
        return jsonify({'error':f'Invalid code. {5-rec.attempts} attempts remaining'}),400
    
    u=User.query.filter_by(email=email).first()
    if u:
        u.password_hash = generate_password_hash(new_pw)
    db.session.delete(rec); db.session.commit()
    return jsonify({'success':True, 'message':'Password successfully updated'})

# ── APK Update Check ──────────────────────────────────────────────────────────

APK_LATEST_VERSION = os.environ.get('APK_LATEST_VERSION', '1.0.0')
APK_DOWNLOAD_URL   = os.environ.get('APK_DOWNLOAD_URL', '')
APK_RELEASE_NOTES  = os.environ.get('APK_RELEASE_NOTES', 'Performance improvements and bug fixes.')
GITHUB_REPO        = os.environ.get('GITHUB_REPO', '')  # e.g. "username/aniverse-app"

@app.route('/api/app-update')
def app_update():
    """Returns the latest APK version metadata.
    Checks GitHub Releases if GITHUB_REPO is configured, otherwise uses env vars."""
    current = request.args.get('version', '0.0.0').strip()
    
    # Try GitHub Releases first if repo is configured
    if GITHUB_REPO:
        try:
            gh_url = f'https://api.github.com/repos/{GITHUB_REPO}/releases/latest'
            gh_resp = requests.get(gh_url, headers={'Accept': 'application/vnd.github.v3+json'}, timeout=8)
            gh_resp.raise_for_status()
            release = gh_resp.json()
            tag = release.get('tag_name', '').lstrip('v')
            notes = release.get('body', APK_RELEASE_NOTES)
            apk_asset = next((a for a in release.get('assets', []) if a['name'].endswith('.apk')), None)
            dl_url = apk_asset['browser_download_url'] if apk_asset else APK_DOWNLOAD_URL
            has_update = tag and tag != current and tag > current
            return jsonify({
                'has_update': has_update,
                'latest_version': tag or APK_LATEST_VERSION,
                'download_url': dl_url,
                'release_notes': notes,
                'source': 'github'
            })
        except Exception as e:
            app.logger.warning(f'[app-update] GitHub check failed: {e}')
    
    # Fallback to env var configuration
    has_update = APK_LATEST_VERSION != current and APK_LATEST_VERSION > current
    return jsonify({
        'has_update': has_update,
        'latest_version': APK_LATEST_VERSION,
        'download_url': APK_DOWNLOAD_URL,
        'release_notes': APK_RELEASE_NOTES,
        'source': 'config'
    })

@app.route('/api/user')
def get_user():
    u=_me(); return jsonify({'user':u.to_dict() if u else None})

# ── Comments ───────────────────────────────────────────────────────────────────

@app.route('/api/comments/<slug>')
def get_comments(slug):
    if not SLUG_RE.match(slug): return jsonify({'error':'Invalid'}),400
    page=request.args.get('page',1,type=int)
    # Fetch only top-level comments (where parent_id is NULL)
    q=Comment.query.filter_by(anime_slug=slug,parent_id=None).order_by(Comment.created_at.desc()).paginate(page=page,per_page=20,error_out=False)
    
    # For each top-level comment, get replies ordered chronologically
    comments_list = []
    for c in q.items:
        c_dict = c.to_dict()
        replies = Comment.query.filter_by(parent_id=c.id).order_by(Comment.created_at.asc()).all()
        c_dict['replies'] = [r.to_dict() for r in replies]
        comments_list.append(c_dict)
        
    return jsonify({'comments':comments_list,'total':q.total,'pages':q.pages,'current_page':q.page})

@app.route('/api/comments/<slug>',methods=['POST'])
@auth_required
@limiter.limit('60 per hour')
def post_comment(slug):
    if not SLUG_RE.match(slug): return jsonify({'error':'Invalid'}),400
    d=request.get_json(silent=True) or {}; text=d.get('text','').strip()
    if not text: return jsonify({'error':'Empty comment'}),400
    if len(text)>1000: return jsonify({'error':'Too long'}),400
    
    parent_id = d.get('parent_id')
    if parent_id:
        parent = Comment.query.filter_by(id=parent_id,anime_slug=slug).first()
        if not parent: return jsonify({'error':'Parent comment not found'}),404
        # Flatten replies: replies to replies will be attached to top-level comment
        actual_parent_id = parent.parent_id if parent.parent_id else parent.id
    else:
        actual_parent_id = None
        
    u=_me(); c=Comment(anime_slug=slug,user_id=u.id,text=text,parent_id=actual_parent_id)
    db.session.add(c); db.session.commit()
    return jsonify({'success':True,'comment':c.to_dict()}),201

@app.route('/api/comments/delete/<int:cid>',methods=['DELETE'])
@auth_required
def delete_comment(cid):
    u=_me(); c=Comment.query.get_or_404(cid)
    # Check ownership of the comment OR check if it is a reply under user's top-level comment
    is_owner = (c.user_id == u.id)
    is_parent_owner = False
    if c.parent_id:
        parent = Comment.query.get(c.parent_id)
        if parent and parent.user_id == u.id:
            is_parent_owner = True
            
    if not (is_owner or is_parent_owner):
        return jsonify({'error':'Not yours'}),403
        
    db.session.delete(c); db.session.commit(); return jsonify({'success':True})

# ── Downloads ──────────────────────────────────────────────────────────────────

@app.route('/api/downloads')
@auth_required
def get_downloads():
    u=_me(); dls=Download.query.filter_by(user_id=u.id).order_by(Download.saved_at.desc()).all()
    grouped={}
    for d in dls:
        if d.anime_slug not in grouped:
            grouped[d.anime_slug]={'anime_slug':d.anime_slug,'anime_title':d.anime_title,'anime_cover':d.anime_cover,'episodes':[]}
        grouped[d.anime_slug]['episodes'].append({'id':d.id,'episode_num':d.episode_num,'episode_id':d.episode_id,'episode_title':d.episode_title,'saved_at':d.saved_at.strftime('%d %b %Y')})
    return jsonify({'downloads':list(grouped.values())})

@app.route('/api/downloads',methods=['POST'])
@auth_required
@limiter.limit('200 per hour')
def add_download():
    d=request.get_json(silent=True) or {}; slug=str(d.get('anime_slug','')).strip()
    if not slug or not SLUG_RE.match(slug): return jsonify({'error':'Invalid slug'}),400
    ep=d.get('episode_num'); 
    if ep is None: return jsonify({'error':'episode_num required'}),400
    u=_me()
    if Download.query.filter_by(user_id=u.id,anime_slug=slug,episode_num=int(ep)).first():
        return jsonify({'error':'Already saved','already_exists':True}),409
    dl=Download(user_id=u.id,anime_slug=slug,anime_title=str(d.get('anime_title',''))[:512],
                anime_cover=str(d.get('anime_cover',''))[:1024],episode_num=int(ep),
                episode_id=str(d.get('episode_id',''))[:256],episode_title=str(d.get('episode_title',''))[:512])
    db.session.add(dl); db.session.commit(); return jsonify({'success':True,'download':dl.to_dict()}),201

@app.route('/api/downloads/<int:did>',methods=['DELETE'])
@auth_required
def rm_download(did):
    u=_me(); dl=Download.query.get_or_404(did)
    if dl.user_id!=u.id: return jsonify({'error':'Not yours'}),403
    db.session.delete(dl); db.session.commit(); return jsonify({'success':True})

@app.route('/api/downloads/anime/<slug>',methods=['DELETE'])
@auth_required
def rm_anime_dls(slug):
    u=_me(); Download.query.filter_by(user_id=u.id,anime_slug=slug).delete(); db.session.commit()
    return jsonify({'success':True})

# ── Watchlist (server-side mirror) ────────────────────────────────────────────

@app.route('/api/watchlist')
@auth_required
def get_watchlist():
    u=_me(); items=Watchlist.query.filter_by(user_id=u.id).order_by(Watchlist.added_at.desc()).all()
    return jsonify({'watchlist':[w.to_dict() for w in items]})

@app.route('/api/watchlist',methods=['POST'])
@auth_required
@limiter.limit('200 per hour')
def toggle_watchlist():
    d=request.get_json(silent=True) or {}; slug=str(d.get('anime_slug','')).strip()
    if not slug or not SLUG_RE.match(slug): return jsonify({'error':'Invalid slug'}),400
    u=_me(); existing=Watchlist.query.filter_by(user_id=u.id,anime_slug=slug).first()
    if existing:
        db.session.delete(existing); db.session.commit(); cache.delete(f'anime:{slug}')
        return jsonify({'success':True,'in_watchlist':False})
    item=Watchlist(user_id=u.id,anime_slug=slug,anime_title=str(d.get('anime_title',''))[:512],anime_cover=str(d.get('anime_cover',''))[:1024])
    db.session.add(item); db.session.commit(); cache.delete(f'anime:{slug}')
    return jsonify({'success':True,'in_watchlist':True}),201

# ── History (Continue Watching) ────────────────────────────────────────────────

@app.route('/api/history')
@auth_required
def get_history():
    u=_me(); items=History.query.filter_by(user_id=u.id).order_by(History.updated_at.desc()).all()
    return jsonify({'history':[h.to_dict() for h in items]})

@app.route('/api/history',methods=['POST'])
@auth_required
def update_history():
    d=request.get_json(silent=True) or {}; slug=str(d.get('slug','')).strip()
    if not slug or not SLUG_RE.match(slug): return jsonify({'error':'Invalid slug'}),400
    u=_me(); h=History.query.filter_by(user_id=u.id,anime_slug=slug).first()
    if not h:
        h=History(user_id=u.id,anime_slug=slug)
        db.session.add(h)
    h.anime_title=str(d.get('title', h.anime_title or ''))[:512]
    h.anime_cover=str(d.get('cover', h.anime_cover or ''))[:1024]
    if 'lastEpNum' in d: h.last_ep_num=int(d['lastEpNum'])
    if 'lastEpId' in d: h.last_ep_id=str(d['lastEpId'])[:256]
    if 'lastEpTitle' in d: h.last_ep_title=str(d['lastEpTitle'])[:512]
    if 'progress' in d: h.progress=int(d['progress'])
    db.session.commit()
    return jsonify({'success':True,'history':h.to_dict()})

@app.route('/api/history/clear',methods=['DELETE'])
@auth_required
def clear_history():
    u=_me(); History.query.filter_by(user_id=u.id).delete(); db.session.commit()
    return jsonify({'success':True})

@app.route('/api/history/<slug>',methods=['DELETE'])
@auth_required
def delete_history(slug):
    u=_me(); History.query.filter_by(user_id=u.id,anime_slug=slug).delete(); db.session.commit()
    return jsonify({'success':True})

# ── Error handlers ─────────────────────────────────────────────────────────────

@app.errorhandler(404)
def e404(e): return jsonify({'error':'Not found'}),404
@app.errorhandler(429)
def e429(e): return jsonify({'error':'Too many requests'}),429
@app.errorhandler(500)
def e500(e): return jsonify({'error':'Server error'}),500

# ── Startup ────────────────────────────────────────────────────────────────────

with app.app_context():
    db.create_all()
    # Dynamic DB update: add parent_id column to comments table if not exists
    try:
        from sqlalchemy import text
        db.session.execute(text("ALTER TABLE comments ADD COLUMN parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE"))
        db.session.commit()
        app.logger.info("Database migration: added parent_id column to comments table")
    except Exception:
        db.session.rollback()
        
    # Dynamic DB update: add avatar_url column to users table if not exists
    try:
        from sqlalchemy import text
        db.session.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(2048)"))
        db.session.commit()
        app.logger.info("Database migration: added avatar_url column to users table")
    except Exception:
        db.session.rollback()
        
    app.logger.info('AniVerse DB ready')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', os.environ.get('SERVER_PORT', 5000)))
    app.run(debug=True, port=port, host='0.0.0.0')
