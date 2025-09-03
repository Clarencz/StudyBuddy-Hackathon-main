import os
import requests
import json
import hmac
import hashlib
from datetime import datetime, timedelta
from decimal import Decimal
from flask import current_app
from src.models.payment import PaymentRecord, SubscriptionPlan, WebhookLog
from src.models.user import User, db

class IntaSendClient:
    def __init__(self, publishable_key=None, secret_key=None, test_mode=True):
        self.publishable_key = publishable_key or os.environ.get('INTASEND_PUBLISHABLE_KEY')
        self.secret_key = secret_key or os.environ.get('INTASEND_SECRET_KEY')
        self.test_mode = test_mode
        self.base_url = "https://sandbox.intasend.com/api/v1" if test_mode else "https://payment.intasend.com/api/"
        
    def _make_request(self, endpoint, method='GET', data=None):
        """Make authenticated request to IntaSend API"""
        url = f"{self.base_url}{endpoint}"
        headers = {
            'Content-Type': 'application/json',
            'X-IntaSend-Public-API-Key': self.publishable_key,
            'Authorization': f'Bearer {self.secret_key}'
        }
        
        try:
            if method == 'POST':
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                response = requests.get(url, headers=headers, timeout=30)
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            current_app.logger.error("IntaSend API timeout")
            raise Exception("Payment service timeout")
        except requests.exceptions.ConnectionError:
            current_app.logger.error("IntaSend API connection error")
            raise Exception("Payment service unavailable")
        except requests.exceptions.HTTPError as e:
            current_app.logger.error(f"IntaSend API HTTP error: {e}")
            if response.status_code == 401:
                raise Exception("Payment service authentication failed")
            elif response.status_code == 400:
                error_data = response.json() if response.content else {}
                raise Exception(f"Payment request invalid: {error_data.get('message', 'Bad request')}")
            else:
                raise Exception("Payment service error")
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"IntaSend API error: {e}")
            raise Exception("Payment service error")
        except json.JSONDecodeError:
            current_app.logger.error("IntaSend API returned invalid JSON")
            raise Exception("Payment service error")
    
    def create_checkout_session(self, amount, currency, email, first_name, last_name, api_ref, redirect_url=None):
        """Create a checkout session"""
        data = {
            'public_key': self.publishable_key,
            'amount': float(amount),
            'currency': currency,
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'api_ref': api_ref,
            'method': 'M-PESA',  # Default to M-Pesa for Kenya
            'redirect_url': redirect_url or f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/payment/callback"
        }
        
        return self._make_request('/checkout/', 'POST', data)
    
    def get_payment_status(self, payment_id):
        """Get payment status by ID"""
        return self._make_request(f'/payments/{payment_id}/')
    
    def verify_webhook_signature(self, payload, signature):
        """Verify webhook signature"""
        webhook_secret = os.environ.get('INTASEND_WEBHOOK_SECRET', self.secret_key)
        expected_signature = hmac.new(
            webhook_secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)

class PaymentService:
    def __init__(self):
        self.intasend_client = IntaSendClient(
            test_mode=os.environ.get('INTASEND_TEST_MODE', 'true').lower() == 'true'
        )
        self.initialize_default_plans()
    
    def initialize_default_plans(self):
        """Initialize default subscription plans if they don't exist"""
        try:
            # Check if plans already exist
            existing_plans = SubscriptionPlan.query.filter_by(is_active=True).count()
            if existing_plans > 0:
                return
            
            # Create default plans
            premium_yearly = SubscriptionPlan(
                plan_id='premium_yearly',
                name='Premium Yearly',
                description='Full access to all StudyBuddy features for one year',
                price=Decimal('650.00'),
                currency='KES',
                duration_days=365,
                features=json.dumps([
                    'Unlimited study rooms',
                    'Advanced AI tutor with GPT-4',
                    'Unlimited document uploads',
                    'Priority support',
                    'Advanced analytics',
                    'Custom branding for study rooms',
                    'Export study data',
                    'Offline access to documents'
                ]),
                is_active=True
            )
            
            premium_monthly = SubscriptionPlan(
                plan_id='premium_monthly',
                name='Premium Monthly',
                description='Full access to all StudyBuddy features for one month',
                price=Decimal('65.00'),
                currency='KES',
                duration_days=30,
                features=json.dumps([
                    'Unlimited study rooms',
                    'Advanced AI tutor with GPT-4',
                    'Unlimited document uploads',
                    'Priority support',
                    'Advanced analytics',
                    'Custom branding for study rooms',
                    'Export study data',
                    'Offline access to documents'
                ]),
                is_active=True
            )
            
            db.session.add(premium_yearly)
            db.session.add(premium_monthly)
            db.session.commit()
            
            current_app.logger.info("Default subscription plans created successfully")
        except Exception as e:
            current_app.logger.error(f"Error initializing default plans: {e}")
            db.session.rollback()
    
    def get_subscription_plans(self):
        """Get all active subscription plans"""
        plans = SubscriptionPlan.query.filter_by(is_active=True).all()
        return [plan.to_dict() for plan in plans]
    
    def create_payment_request(self, user_id, plan_id):
        """Create a payment request for subscription"""
        try:
            user = User.query.get(user_id)
            if not user:
                raise ValueError("User not found")
            
            plan = SubscriptionPlan.query.filter_by(plan_id=plan_id, is_active=True).first()
            if not plan:
                raise ValueError("Invalid subscription plan")
            
            # Check if IntaSend credentials are configured
            if not self.intasend_client.publishable_key or not self.intasend_client.secret_key:
                raise Exception("Payment service not configured. Please contact support.")
            
            # Generate unique API reference
            api_ref = f"studybuddy_{user_id}_{plan_id}_{int(datetime.utcnow().timestamp())}"
            
            # Create payment record
            payment_record = PaymentRecord(
                user_id=user_id,
                amount=plan.price,
                currency=plan.currency,
                status='pending',
                plan_type=plan_id,
                api_ref=api_ref,
                expires_at=datetime.utcnow() + timedelta(hours=1)  # Payment expires in 1 hour
            )
            
            db.session.add(payment_record)
            db.session.flush()  # Get the ID without committing
            
            try:
                # Create IntaSend checkout session
                checkout_response = self.intasend_client.create_checkout_session(
                    amount=plan.price,
                    currency=plan.currency,
                    email=user.email,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    api_ref=api_ref
                )
                
                if not checkout_response or not checkout_response.get('url'):
                    raise Exception("Invalid response from payment service")
                
                # Update payment record with IntaSend payment ID
                payment_record.intasend_payment_id = checkout_response.get('id')
                db.session.commit()
                
                return {
                    'payment_id': payment_record.id,
                    'intasend_payment_id': checkout_response.get('id'),
                    'checkout_url': checkout_response.get('url'),
                    'amount': float(plan.price),
                    'currency': plan.currency,
                    'expires_at': payment_record.expires_at.isoformat(),
                    'api_ref': api_ref
                }
                
            except Exception as e:
                # Mark payment as failed and rollback
                payment_record.status = 'failed'
                db.session.commit()
                raise e
            
        except ValueError as e:
            # Don't rollback for validation errors
            raise e
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Payment creation error: {e}")
            raise Exception(f"Payment creation failed: {str(e)}")
    
    def process_webhook(self, payload, signature):
        """Process IntaSend webhook"""
        try:
            # Log webhook
            webhook_log = WebhookLog(
                webhook_type='intasend',
                payload=payload,
                signature=signature,
                status='received'
            )
            db.session.add(webhook_log)
            db.session.commit()
            
            # Verify signature
            if not self.intasend_client.verify_webhook_signature(payload, signature):
                webhook_log.mark_failed("Invalid webhook signature")
                raise ValueError("Invalid webhook signature")
            
            # Parse webhook data
            webhook_data = json.loads(payload)
            api_ref = webhook_data.get('api_ref')
            status = webhook_data.get('status')
            amount = webhook_data.get('amount')
            
            if not api_ref:
                webhook_log.mark_failed("Missing api_ref in webhook data")
                raise ValueError("Missing api_ref in webhook data")
            
            # Find payment record
            payment_record = PaymentRecord.query.filter_by(api_ref=api_ref).first()
            if not payment_record:
                webhook_log.mark_failed(f"Payment record not found for api_ref: {api_ref}")
                raise ValueError(f"Payment record not found for api_ref: {api_ref}")
            
            # Update payment record
            payment_record.status = self._map_intasend_status(status)
            payment_record.callback_data = payload
            payment_record.payment_method = webhook_data.get('method', 'M-PESA')
            
            # If payment is successful, activate subscription
            if payment_record.status == 'completed' and float(amount) == float(payment_record.amount):
                self._activate_subscription(payment_record)
            
            db.session.commit()
            webhook_log.mark_processed()
            
            return {
                'status': 'success',
                'payment_id': payment_record.id,
                'subscription_activated': payment_record.status == 'completed'
            }
            
        except Exception as e:
            db.session.rollback()
            if 'webhook_log' in locals():
                webhook_log.mark_failed(str(e))
            current_app.logger.error(f"Webhook processing error: {e}")
            raise e
    
    def _map_intasend_status(self, intasend_status):
        """Map IntaSend status to our internal status"""
        status_mapping = {
            'COMPLETE': 'completed',
            'PENDING': 'pending',
            'FAILED': 'failed',
            'CANCELLED': 'cancelled'
        }
        return status_mapping.get(intasend_status, 'pending')
    
    def _activate_subscription(self, payment_record):
        """Activate user subscription"""
        try:
            user = User.query.get(payment_record.user_id)
            if not user:
                raise ValueError("User not found")
            
            plan = SubscriptionPlan.query.filter_by(plan_id=payment_record.plan_type).first()
            if not plan:
                raise ValueError("Subscription plan not found")
            
            # Calculate subscription end date
            if user.premium_expires and user.premium_expires > datetime.utcnow():
                # Extend existing subscription
                subscription_end = user.premium_expires + timedelta(days=plan.duration_days)
            else:
                # New subscription
                subscription_end = datetime.utcnow() + timedelta(days=plan.duration_days)
            
            # Update user subscription
            user.is_premium = True
            user.premium_expires = subscription_end
            
            current_app.logger.info(f"Subscription activated for user {user.id} until {subscription_end}")
            
        except Exception as e:
            current_app.logger.error(f"Subscription activation error: {e}")
            raise e
    
    def get_user_subscription_status(self, user_id):
        """Get user's current subscription status"""
        try:
            user = User.query.get(user_id)
            if not user:
                raise ValueError("User not found")
            
            is_active = user.is_premium and (
                not user.premium_expires or 
                user.premium_expires > datetime.utcnow()
            )
            
            days_remaining = 0
            if user.premium_expires and is_active:
                days_remaining = (user.premium_expires - datetime.utcnow()).days
            
            return {
                'is_premium': user.is_premium,
                'premium_expires': user.premium_expires.isoformat() if user.premium_expires else None,
                'is_active': is_active,
                'days_remaining': max(0, days_remaining),
                'subscription_level': 'premium' if is_active else 'free'
            }
            
        except Exception as e:
            current_app.logger.error(f"Error getting subscription status: {e}")
            raise e
    
    def cancel_subscription(self, user_id):
        """Cancel user subscription"""
        try:
            user = User.query.get(user_id)
            if not user:
                raise ValueError("User not found")
            
            if not user.is_premium:
                raise ValueError("No active subscription to cancel")
            
            # Mark subscription as cancelled but keep access until expiry
            # In a real implementation, you might want to call IntaSend to cancel recurring payments
            
            current_app.logger.info(f"Subscription cancellation requested for user {user.id}")
            
            return {
                'message': 'Subscription will not renew automatically',
                'access_until': user.premium_expires.isoformat() if user.premium_expires else None
            }
            
        except Exception as e:
            current_app.logger.error(f"Subscription cancellation error: {e}")
            raise e
    
    def get_payment_history(self, user_id, limit=10):
        """Get user's payment history"""
        try:
            payments = PaymentRecord.query.filter_by(user_id=user_id)\
                                        .order_by(PaymentRecord.created_at.desc())\
                                        .limit(limit).all()
            
            return [payment.to_dict() for payment in payments]
            
        except Exception as e:
            current_app.logger.error(f"Error getting payment history: {e}")
            raise e

