from src.extensions import db

# Import models so they get registered with SQLAlchemy
# These imports must come *after* db is defined
from .user import User
from .study_room import StudyRoom, RoomMembership, StudySession
from .ai_tutor import AIConversation, AIMessage, Flashcard, PracticeTest
from .document import Document, DocumentShare
from .payment import PaymentRecord, SubscriptionPlan, WebhookLog
from .profile import ProfileSettings, LMSIntegration, UserActivity
from .whiteboard import WhiteboardSession, WhiteboardHistory, RoomDocument, CollaborationEvent

# Now, any file that needs the database can do:
# from src.models import db, User, StudyRoom, ...