import os
import sys
import logging
from datetime import datetime
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify, request, g
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.exceptions import HTTPException
from src.extensions import db
from src.models import (
    User, StudyRoom, Document, 
    StudyRoom, RoomMembership, StudySession,
    AIConversation, AIMessage, Flashcard, PracticeTest,
    Document, DocumentShare,
    PaymentRecord, SubscriptionPlan, WebhookLog,
    ProfileSettings, LMSIntegration, UserActivity,
    WhiteboardSession, WhiteboardHistory, RoomDocument, CollaborationEvent
)
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.study_room import room_bp
from src.routes.ai_tutor import ai_bp
from src.routes.document import document_bp
from src.routes.payment import payment_bp
from src.routes.external_services import external_bp
from src.routes.profile import profile_bp
from src.routes.whiteboard import whiteboard_bp

def create_app():
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'studybuddy-secret-key-change-in-production')
    app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
    app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for API
    app.config['JSON_SORT_KEYS'] = False
    
    # Security headers
    @app.after_request
    def after_request(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response

    # Enable CORS for all routes
    CORS(app,
         origins=[
             "https://studybuddy-hackathon-main-production.up.railway.app",
             "https://study-buddy-hackathon-main.vercel.app"
             
         ],
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # Rate limiting
    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        default_limits=["1000 per hour"],
        storage_uri="memory://"
    )

    # Request logging middleware
    @app.before_request
    def log_request_info():
        g.start_time = datetime.utcnow()
        if request.endpoint:
            app.logger.info(f"{request.method} {request.path} - {request.remote_addr}")

    @app.after_request
    def log_response_info(response):
        if hasattr(g, 'start_time'):
            duration = (datetime.utcnow() - g.start_time).total_seconds()
            app.logger.info(f"Response: {response.status_code} - Duration: {duration:.3f}s")
        return response

    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'error': 'Bad Request',
            'message': 'The request could not be understood by the server'
        }), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Authentication required'
        }), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'error': 'Forbidden',
            'message': 'Access denied'
        }), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource was not found'
        }), 404

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({
            'error': 'File Too Large',
            'message': 'The uploaded file exceeds the maximum allowed size (50MB)'
        }), 413

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({
            'error': 'Rate Limit Exceeded',
            'message': 'Too many requests. Please try again later.'
        }), 429

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        app.logger.error(f"Internal server error: {error}")
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred'
        }), 500

    @app.errorhandler(HTTPException)
    def handle_exception(e):
        return jsonify({
            'error': e.name,
            'message': e.description
        }), e.code

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(room_bp, url_prefix='/api')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(document_bp, url_prefix='/api/documents')
    app.register_blueprint(payment_bp, url_prefix='/api/payment')
    app.register_blueprint(external_bp, url_prefix='/api/external')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(whiteboard_bp, url_prefix='/api')

    # Database configuration
    database_dir = os.path.join(os.path.dirname(__file__), 'database')
    os.makedirs(database_dir, exist_ok=True)
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(database_dir, 'app.db')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    db.init_app(app)

    # Create upload directory
    upload_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = upload_dir

    # Initialize database
    with app.app_context():
        db.create_all()

    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        try:
            # Test database connection
            from sqlalchemy import text
            db.session.execute(text('SELECT 1'))
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'version': '1.0.0'
            })
        except Exception as e:
            app.logger.error(f"Health check failed: {e}")
            return jsonify({
                'status': 'unhealthy',
                'error': str(e)
            }), 500

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        # Handle API requests that aren't matched by any blueprint
        if path.startswith('api/'):
            return jsonify({'error': 'API route not found'}), 404

        static_folder_path = app.static_folder
        if static_folder_path is None:
            return "Static folder not configured", 404

        full_path = os.path.join(static_folder_path, path)
        if path != "" and os.path.exists(full_path):
            return send_from_directory(static_folder_path, path)

        # Serve frontend index.html for all other routes
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')

        return "index.html not found", 404

    return app

app = create_app()

if __name__ == '__main__':
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s %(levelname)s %(name)s %(message)s'
    )
    
    app.run(host='0.0.0.0', port=5000, debug=True)

